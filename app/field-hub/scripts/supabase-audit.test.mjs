import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  auditConfigText,
  auditMigrations,
  auditParentOwnershipCoverage,
  auditServiceRoleReferences,
  runStaticAudit,
} from './supabase-audit.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

function failureIds(result) {
  return result.checks.filter((check) => check.status === 'failed').map((check) => check.id)
}

describe('supabase-audit', () => {
  it('accepts controlled beta auth defaults', () => {
    const result = auditConfigText(`
[auth]
enable_signup = false
minimum_password_length = 12

[auth.email]
enable_signup = false
`)

    expect(result.ok).toBe(true)
  })

  it('rejects self-signup, email signup and short passwords', () => {
    const result = auditConfigText(`
[auth]
enable_signup = true
minimum_password_length = 6

[auth.email]
enable_signup = true
`)

    expect(result.ok).toBe(false)
    expect(failureIds(result)).toEqual(
      expect.arrayContaining([
        'supabase.auth.self_signup_disabled',
        'supabase.auth.email_signup_disabled',
        'supabase.auth.minimum_password_length',
      ]),
    )
  })

  it('rejects missing RLS coverage for known dynamic tables', () => {
    const result = auditMigrations([
      {
        filePath: '001_players.sql',
        text: 'create table public.players (id uuid primary key, user_id uuid not null);',
      },
    ])

    expect(result.ok).toBe(false)
    expect(failureIds(result)).toContain('supabase.rls.players')
  })

  it('rejects child insert policies that only check auth uid and user id', () => {
    const result = auditParentOwnershipCoverage(
      `
        create policy "Users can insert own player_session_entries"
        on public.player_session_entries for insert to authenticated
        with check ((select auth.uid()) = user_id);
      `,
      'player_session_entries',
      'insert',
    )

    expect(result.status).toBe('failed')
    expect(result.message).toContain('player_id')
    expect(result.message).toContain('session_log_id')
  })

  it('accepts child insert policies that verify player and session parents', () => {
    const result = auditParentOwnershipCoverage(
      `
        create policy "Users can insert own player_session_entries"
        on public.player_session_entries for insert to authenticated
        with check (
          (select auth.uid()) = user_id
          and exists (
            select 1
            from public.players
            where players.id = player_session_entries.player_id
              and players.user_id = player_session_entries.user_id
          )
          and (
            session_log_id is null
            or exists (
              select 1
              from public.session_logs
              where session_logs.id = player_session_entries.session_log_id
                and session_logs.user_id = player_session_entries.user_id
            )
          )
        );
      `,
      'player_session_entries',
      'insert',
    )

    expect(result.status).toBe('passed')
  })

  it('allows only Public/Kiosk anon access and rejects service role drift', () => {
    const result = auditMigrations([
      {
        filePath: '001_bad_anon.sql',
        text: `
          grant select on public.players to anon;
          create policy "Anon can select players" on public.players for select to anon using (true);
          -- service_role must never appear in project migrations.
        `,
      },
    ])

    expect(result.ok).toBe(false)
    expect(failureIds(result)).toEqual(
      expect.arrayContaining(['supabase.migrations.anon_surface', 'supabase.migrations.service_role']),
    )
  })

  it('rejects public security definer functions', () => {
    const result = auditMigrations([
      {
        filePath: '001_public_function.sql',
        text: `
          create or replace function public.leak()
          returns text
          language sql
          security definer
          as $$ select 'bad' $$;
        `,
      },
    ])

    expect(result.ok).toBe(false)
    expect(failureIds(result)).toContain('supabase.migrations.public_security_definer')
  })

  it('rejects service role key references in env examples', () => {
    const forbiddenKey = ['SUPABASE', 'SERVICE', 'ROLE', 'KEY='].join('_')
    const result = auditServiceRoleReferences([
      { filePath: 'app/field-hub/.env.example', text: `${forbiddenKey}\n` },
    ])

    expect(result.ok).toBe(false)
    expect(failureIds(result)).toContain('supabase.secrets.client_service_role')
  })

  it('keeps the current repository Supabase guardrails green', () => {
    const result = runStaticAudit({ repoRoot })

    expect(result.ok).toBe(true)
  })
})

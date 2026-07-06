import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { auditConfigText, auditMigrations, auditServiceRoleReferences, runStaticAudit } from './supabase-audit.mjs'

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

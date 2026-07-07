import { describe, expect, it } from 'vitest'

import { betaPreflight, buildQaPlan, maskCommandForLog } from './qa-gate.mjs'

describe('qa-gate', () => {
  it('blocks beta when required credentials or mutation opt-in are missing', () => {
    const result = betaPreflight({
      FIELD_HUB_E2E_EMAIL: 'coach@example.test',
      FIELD_HUB_E2E_PASSWORD: '',
      FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION: '0',
    })

    expect(result).toEqual({
      ok: false,
      status: 'blocked',
      missing: ['FIELD_HUB_E2E_PASSWORD', 'FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1'],
    })
  })

  it('sets auth-required Sprint 19 and remote Kiosk checks only for beta', () => {
    const localPlan = buildQaPlan('local', {})
    const betaPlan = buildQaPlan('beta', {
      FIELD_HUB_E2E_EMAIL: 'coach@example.test',
      FIELD_HUB_E2E_PASSWORD: 'secret-value',
      FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION: '1',
    })

    expect(localPlan.map((step) => step.name)).toEqual([
      'supabase-audit',
      'typecheck',
      'lint',
      'test',
      'build',
      'pwa-e2e',
      'sprint19-visual-qa',
    ])
    expect(localPlan.at(-1)?.env ?? {}).not.toHaveProperty('FIELD_HUB_SPRINT19_REQUIRE_AUTH')

    expect(betaPlan.at(0)?.name).toBe('supabase-audit')
    expect(betaPlan.at(-2)?.env).toMatchObject({ FIELD_HUB_SPRINT19_REQUIRE_AUTH: '1' })
    expect(betaPlan.at(-1)?.name).toBe('kiosk-e2e')
    expect(betaPlan.at(-1)?.env).toMatchObject({
      FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION: '1',
      FIELD_HUB_E2E_REQUIRE_PREVIEW: '1',
    })
  })

  it('does not print secret env values in command logs', () => {
    const command = maskCommandForLog({
      command: 'npm',
      args: ['run', 'test:e2e:kiosk'],
      env: {
        FIELD_HUB_E2E_EMAIL: 'coach@example.test',
        FIELD_HUB_E2E_PASSWORD: 'secret-value',
        FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION: '1',
      },
    })

    expect(command).toContain('FIELD_HUB_E2E_EMAIL=[set]')
    expect(command).toContain('FIELD_HUB_E2E_PASSWORD=[set]')
    expect(command).toContain('FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1')
    expect(command).not.toContain('coach@example.test')
    expect(command).not.toContain('secret-value')
  })
})

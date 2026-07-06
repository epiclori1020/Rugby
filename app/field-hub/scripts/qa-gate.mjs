import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sensitiveEnvKeys = new Set(['FIELD_HUB_E2E_EMAIL', 'FIELD_HUB_E2E_PASSWORD'])

export function betaPreflight(env = process.env) {
  const missing = []

  if (!env.FIELD_HUB_E2E_EMAIL) {
    missing.push('FIELD_HUB_E2E_EMAIL')
  }
  if (!env.FIELD_HUB_E2E_PASSWORD) {
    missing.push('FIELD_HUB_E2E_PASSWORD')
  }
  if (env.FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION !== '1') {
    missing.push('FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1')
  }

  return missing.length > 0 ? { ok: false, status: 'blocked', missing } : { ok: true, status: 'checked', missing: [] }
}

export function buildQaPlan(mode, env = process.env) {
  if (!['local', 'beta'].includes(mode)) {
    throw new Error(`Unbekannter QA-Modus: ${mode}. Nutze "local" oder "beta".`)
  }

  const baseSteps = [
    { name: 'supabase-audit', command: 'npm', args: ['run', 'supabase:audit'] },
    { name: 'typecheck', command: 'npm', args: ['run', 'typecheck'] },
    { name: 'lint', command: 'npm', args: ['run', 'lint'] },
    { name: 'test', command: 'npm', args: ['run', 'test'] },
    { name: 'build', command: 'npm', args: ['run', 'build'] },
    { name: 'pwa-e2e', command: 'node', args: ['scripts/e2e-pwa-smoke.mjs'] },
  ]

  if (mode === 'local') {
    return [
      ...baseSteps,
      { name: 'sprint19-visual-qa', command: 'node', args: ['scripts/e2e-sprint19-visual-qa.mjs'] },
    ]
  }

  const preflight = betaPreflight(env)
  if (!preflight.ok) {
    return []
  }

  return [
    ...baseSteps,
    {
      name: 'sprint19-visual-qa',
      command: 'node',
      args: ['scripts/e2e-sprint19-visual-qa.mjs'],
      env: { FIELD_HUB_SPRINT19_REQUIRE_AUTH: '1' },
    },
    {
      name: 'kiosk-e2e',
      command: 'node',
      args: ['scripts/e2e-kiosk-smoke.mjs'],
      env: { FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION: '1' },
    },
  ]
}

export function maskCommandForLog(step) {
  const envParts = Object.entries(step.env ?? {}).map(([key, value]) => {
    if (sensitiveEnvKeys.has(key)) {
      return `${key}=[set]`
    }
    return `${key}=${value}`
  })

  return [...envParts, step.command, ...(step.args ?? [])].join(' ')
}

async function runStep(step) {
  console.log(`\n[qa-gate] ${step.name}: ${maskCommandForLog(step)}`)

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(step.command, step.args, {
      cwd: rootDir,
      env: { ...process.env, ...(step.env ?? {}) },
      stdio: 'inherit',
    })

    child.on('error', rejectPromise)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise()
        return
      }
      rejectPromise(new Error(`${step.name} fehlgeschlagen (${signal ? `signal ${signal}` : `exit ${code}`}).`))
    })
  })
}

async function main() {
  const mode = process.argv[2]
  if (!['local', 'beta'].includes(mode)) {
    console.error('Nutzung: node scripts/qa-gate.mjs <local|beta>')
    process.exitCode = 1
    return
  }

  if (mode === 'beta') {
    const preflight = betaPreflight(process.env)
    if (!preflight.ok) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            status: 'blocked',
            reason: 'Beta-QA braucht Laufzeit-Credentials und explizites Remote-Mutation-Opt-in.',
            missing: preflight.missing,
          },
          null,
          2,
        ),
      )
      process.exitCode = 1
      return
    }
  }

  const steps = buildQaPlan(mode, process.env)
  for (const step of steps) {
    await runStep(step)
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: 'checked',
        mode,
        checked: steps.map((step) => step.name),
      },
      null,
      2,
    ),
  )
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}

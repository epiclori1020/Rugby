import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(rootDir, '../..')
const sensitiveEnvKeys = new Set(['FIELD_HUB_E2E_EMAIL', 'FIELD_HUB_E2E_PASSWORD'])
const reportDir = resolve(repoRoot, '.tmp/onfield-qa')

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
      env: { FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION: '1', FIELD_HUB_E2E_REQUIRE_PREVIEW: '1' },
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

function redactValue(value) {
  if (!value) {
    return value
  }
  return String(value)
    .replace(/([?&](?:access_token|refresh_token|token|password|key|secret)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/bearer\s+[a-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/sk-proj-[a-z0-9_-]{20,}/gi, 'sk-proj-[redacted]')
    .replace(/sb_secret_[a-z0-9_-]{20,}/gi, 'sb_secret_[redacted]')
}

function publicEnvSnapshot(env = process.env) {
  return {
    hasEmail: Boolean(env.FIELD_HUB_E2E_EMAIL),
    hasPassword: Boolean(env.FIELD_HUB_E2E_PASSWORD),
    allowRemoteMutation: env.FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION === '1',
    pwaBaseUrl: redactValue(env.FIELD_HUB_PWA_E2E_BASE_URL ?? null),
    sprint19BaseUrl: redactValue(env.FIELD_HUB_SPRINT19_E2E_BASE_URL ?? null),
    kioskBaseUrl: redactValue(env.FIELD_HUB_E2E_BASE_URL ?? null),
  }
}

function writeQaReport({ mode, status, steps, stepResults, preflight, error }) {
  mkdirSync(reportDir, { recursive: true })
  const report = {
    generatedAt: new Date().toISOString(),
    ok: status === 'checked',
    status,
    mode,
    environment: publicEnvSnapshot(),
    preflight,
    steps: steps.map((step) => ({
      name: step.name,
      command: maskCommandForLog(step),
    })),
    results: stepResults,
    error: error ? redactValue(error instanceof Error ? error.message : String(error)) : null,
  }
  const reportPath = resolve(reportDir, `qa-${mode}-${Date.now()}.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
  console.log(`[qa-gate] report: ${reportPath}`)
  return reportPath
}

class QaStepError extends Error {
  constructor(message, result) {
    super(message)
    this.name = 'QaStepError'
    this.result = result
  }
}

async function runStep(step) {
  console.log(`\n[qa-gate] ${step.name}: ${maskCommandForLog(step)}`)
  const startedAt = Date.now()

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
      const result = {
        name: step.name,
        status: 'failed',
        exitCode: code,
        signal,
        durationMs: Date.now() - startedAt,
      }
      rejectPromise(new QaStepError(`${step.name} fehlgeschlagen (${signal ? `signal ${signal}` : `exit ${code}`}).`, result))
    })
  })

  return {
    name: step.name,
    status: 'checked',
    exitCode: 0,
    signal: null,
    durationMs: Date.now() - startedAt,
  }
}

async function main() {
  const mode = process.argv[2]
  if (!['local', 'beta'].includes(mode)) {
    console.error('Nutzung: node scripts/qa-gate.mjs <local|beta>')
    process.exitCode = 1
    return
  }

  const preflight = mode === 'beta' ? betaPreflight(process.env) : { ok: true, status: 'checked', missing: [] }
  if (mode === 'beta') {
    if (!preflight.ok) {
      writeQaReport({ mode, status: 'blocked', steps: [], stepResults: [], preflight })
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
  const stepResults = []
  try {
    for (const step of steps) {
      stepResults.push(await runStep(step))
    }
  } catch (error) {
    if (error instanceof QaStepError) {
      stepResults.push(error.result)
    }
    writeQaReport({ mode, status: 'failed', steps, stepResults, preflight, error })
    throw error
  }
  writeQaReport({ mode, status: 'checked', steps, stepResults, preflight })

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

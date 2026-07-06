import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultRepoRoot = resolve(appRoot, '../..')

const standardDynamicTables = [
  'players',
  'session_logs',
  'player_session_entries',
  'progress_entries',
  'baseline_entries',
  'returner_entries',
  'session_block_logs',
  'metric_results',
  'exercise_results',
  'player_exposure_summaries',
]

const publicCheckinTables = [
  {
    name: 'public_checkin_links',
    authenticatedActions: ['select', 'insert', 'update', 'delete'],
    anonActions: ['select'],
  },
  {
    name: 'public_checkin_link_players',
    authenticatedActions: ['select', 'insert', 'update', 'delete'],
    anonActions: ['select'],
  },
  {
    name: 'public_checkin_submissions',
    authenticatedActions: ['select', 'update', 'delete'],
    anonActions: ['insert'],
  },
]

const allowedAnonTables = new Set(publicCheckinTables.map((table) => table.name))
const allowedAnonFunctionFragments = [
  'private.current_checkin_token_hash',
  'private.is_active_public_checkin_link',
  'private.is_active_public_checkin_link_player',
]

function stripInlineTomlComment(value) {
  let inString = false
  let quote = ''

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if ((character === '"' || character === "'") && value[index - 1] !== '\\') {
      if (!inString) {
        inString = true
        quote = character
      } else if (quote === character) {
        inString = false
      }
    }
    if (character === '#' && !inString) {
      return value.slice(0, index).trim()
    }
  }

  return value.trim()
}

function parseTomlValue(rawValue) {
  const value = stripInlineTomlComment(rawValue)
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  if (/^-?\d+$/.test(value)) {
    return Number(value)
  }
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

export function parseTomlSections(configText) {
  const sections = { root: {} }
  let currentSection = sections.root

  for (const line of configText.split(/\r?\n/)) {
    const sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*(?:#.*)?$/)
    if (sectionMatch) {
      currentSection = {}
      sections[sectionMatch[1].trim()] = currentSection
      continue
    }

    const keyMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.+)$/)
    if (!keyMatch) {
      continue
    }

    currentSection[keyMatch[1]] = parseTomlValue(keyMatch[2])
  }

  return sections
}

function passed(id, message) {
  return { id, status: 'passed', message }
}

function failed(id, message) {
  return { id, status: 'failed', message }
}

function combineResults(checks) {
  return {
    ok: checks.every((check) => check.status === 'passed'),
    checks,
    failures: checks.filter((check) => check.status === 'failed'),
  }
}

export function auditConfigText(configText) {
  const sections = parseTomlSections(configText)
  const auth = sections.auth ?? {}
  const email = sections['auth.email'] ?? {}
  const checks = []

  checks.push(
    auth.enable_signup === false
      ? passed('supabase.auth.self_signup_disabled', '[auth].enable_signup is false.')
      : failed('supabase.auth.self_signup_disabled', '[auth].enable_signup must be false for controlled beta.'),
  )

  checks.push(
    email.enable_signup === false
      ? passed('supabase.auth.email_signup_disabled', '[auth.email].enable_signup is false.')
      : failed(
          'supabase.auth.email_signup_disabled',
          '[auth.email].enable_signup must be false; beta coach accounts are created manually.',
        ),
  )

  checks.push(
    Number(auth.minimum_password_length) >= 12
      ? passed('supabase.auth.minimum_password_length', '[auth].minimum_password_length is at least 12.')
      : failed('supabase.auth.minimum_password_length', '[auth].minimum_password_length must be at least 12.'),
  )

  return combineResults(checks)
}

function normalizeSql(sqlText) {
  return sqlText.toLowerCase().replace(/\s+/g, ' ').trim()
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function policyBlocksFor(normalizedSql, tableName, action, role) {
  const table = escapeRegex(tableName)
  const pattern = new RegExp(
    `create\\s+policy\\s+[\\s\\S]*?\\s+on\\s+public\\.${table}\\s+for\\s+${action}\\s+to\\s+${role}\\s+[\\s\\S]*?;`,
    'g',
  )
  return normalizedSql.match(pattern) ?? []
}

function hasRlsEnabled(normalizedSql, tableName) {
  return normalizedSql.includes(`alter table public.${tableName} enable row level security;`)
}

function hasAuthenticatedOwnerPolicy(normalizedSql, tableName, action) {
  return policyBlocksFor(normalizedSql, tableName, action, 'authenticated').some(
    (block) => block.includes('auth.uid()') && block.includes('user_id'),
  )
}

function hasAnonPolicy(normalizedSql, tableName, action) {
  return policyBlocksFor(normalizedSql, tableName, action, 'anon').length > 0
}

function auditTableCoverage(normalizedSql, tableName, authenticatedActions, anonActions = []) {
  const missing = []

  if (!hasRlsEnabled(normalizedSql, tableName)) {
    missing.push('RLS')
  }

  for (const action of authenticatedActions) {
    if (!hasAuthenticatedOwnerPolicy(normalizedSql, tableName, action)) {
      missing.push(`authenticated ${action}`)
    }
  }

  for (const action of anonActions) {
    if (!hasAnonPolicy(normalizedSql, tableName, action)) {
      missing.push(`anon ${action}`)
    }
  }

  return missing.length === 0
    ? passed(`supabase.rls.${tableName}`, `${tableName} has expected RLS/policy coverage.`)
    : failed(`supabase.rls.${tableName}`, `${tableName} is missing: ${missing.join(', ')}.`)
}

function findUnexpectedAnonStatements(normalizedSql) {
  const unexpected = []
  const grantStatements = normalizedSql.match(/\bgrant\b[\s\S]*?;/g) ?? []
  const policyStatements = normalizedSql.match(/\bcreate\s+policy\b[\s\S]*?;/g) ?? []

  for (const statement of grantStatements) {
    if (!/\bto\s+anon\b/.test(statement)) {
      continue
    }

    const grantsAllowedTable =
      [...allowedAnonTables].some((table) => statement.includes(`on public.${table}`)) ||
      statement.includes('on schema private') ||
      allowedAnonFunctionFragments.some((fragment) => statement.includes(`on function ${fragment}`))

    if (!grantsAllowedTable) {
      unexpected.push(statement)
    }
  }

  for (const statement of policyStatements) {
    if (!/\bto\s+anon\b/.test(statement)) {
      continue
    }

    const policyAllowed = [...allowedAnonTables].some((table) => statement.includes(`on public.${table}`))
    if (!policyAllowed) {
      unexpected.push(statement)
    }
  }

  return unexpected
}

function auditAnonSurface(normalizedSql) {
  const unexpected = findUnexpectedAnonStatements(normalizedSql)

  return unexpected.length === 0
    ? passed('supabase.migrations.anon_surface', 'anon access is limited to Public/Kiosk check-in surfaces.')
    : failed(
        'supabase.migrations.anon_surface',
        `Unexpected anon migration statements: ${unexpected.map((statement) => statement.slice(0, 120)).join(' | ')}`,
      )
}

function auditForbiddenSql(normalizedSql) {
  const checks = []

  checks.push(
    /\bservice[_-]?role\b/.test(normalizedSql)
      ? failed('supabase.migrations.service_role', 'Migration SQL must not reference service_role.')
      : passed('supabase.migrations.service_role', 'Migration SQL does not reference service_role.'),
  )

  checks.push(
    /\bauth\.role\s*\(/.test(normalizedSql)
      ? failed('supabase.migrations.auth_role', 'Migration SQL must not depend on auth.role() role checks.')
      : passed('supabase.migrations.auth_role', 'Migration SQL does not depend on auth.role().'),
  )

  checks.push(
    /\bcreate\s+(?:or\s+replace\s+)?function\s+public\.[\s\S]*?\bsecurity\s+definer\b/.test(normalizedSql)
      ? failed('supabase.migrations.public_security_definer', 'Public schema security definer functions are blocked.')
      : passed('supabase.migrations.public_security_definer', 'No public security definer functions detected.'),
  )

  return checks
}

export function auditMigrations(migrationFiles) {
  const normalizedSql = normalizeSql(migrationFiles.map((file) => file.text).join('\n'))
  const checks = [
    ...auditForbiddenSql(normalizedSql),
    auditAnonSurface(normalizedSql),
    ...standardDynamicTables.map((table) =>
      auditTableCoverage(normalizedSql, table, ['select', 'insert', 'update', 'delete']),
    ),
    ...publicCheckinTables.map((table) =>
      auditTableCoverage(normalizedSql, table.name, table.authenticatedActions, table.anonActions),
    ),
  ]

  return combineResults(checks)
}

function readMigrationFiles(repoRoot) {
  const migrationsDir = join(repoRoot, 'supabase', 'migrations')
  return readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort()
    .map((fileName) => {
      const filePath = join(migrationsDir, fileName)
      return { filePath, text: readFileSync(filePath, 'utf8') }
    })
}

function readTextFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory)) {
    const filePath = join(directory, entry)
    const stats = statSync(filePath)
    if (stats.isDirectory()) {
      if (!['node_modules', 'dist', '.vite', 'coverage'].includes(basename(filePath))) {
        files.push(...readTextFiles(filePath))
      }
      continue
    }
    if (/\.(?:js|mjs|cjs|ts|tsx|json|env|example)$/.test(filePath)) {
      files.push({ filePath, text: readFileSync(filePath, 'utf8') })
    }
  }
  return files
}

export function auditServiceRoleReferences(files, repoRoot = '') {
  const findings = files
    .filter((file) => basename(file.filePath) !== 'supabase-audit.mjs')
    .filter((file) => /\b(SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|serviceRoleKey|service_role_key)\b/.test(file.text))
    .map((file) => (repoRoot ? file.filePath.replace(`${repoRoot}/`, '') : file.filePath))

  const check = findings.length === 0
    ? passed('supabase.secrets.client_service_role', 'No client/script/env-example service-role key references detected.')
    : failed('supabase.secrets.client_service_role', `Forbidden service-role key references: ${findings.join(', ')}`)

  return combineResults([check])
}

function auditClientSecretDrift(repoRoot) {
  const envExamplePath = join(repoRoot, 'app', 'field-hub', '.env.example')
  const scanRoots = [join(repoRoot, 'app', 'field-hub', 'src'), join(repoRoot, 'app', 'field-hub', 'scripts')]
  const files = [
    ...scanRoots.flatMap((root) => readTextFiles(root)),
    { filePath: envExamplePath, text: readFileSync(envExamplePath, 'utf8') },
  ]

  return auditServiceRoleReferences(files, repoRoot).checks[0]
}

export function runStaticAudit({ repoRoot = defaultRepoRoot } = {}) {
  const configPath = join(repoRoot, 'supabase', 'config.toml')
  const configResult = auditConfigText(readFileSync(configPath, 'utf8'))
  const migrationResult = auditMigrations(readMigrationFiles(repoRoot))
  const secretCheck = auditClientSecretDrift(repoRoot)

  return combineResults([...configResult.checks, ...migrationResult.checks, secretCheck])
}

function printResult(result) {
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        status: result.ok ? 'checked' : 'failed',
        checked: result.checks.map((check) => check.id),
        failures: result.failures.map((failure) => ({
          id: failure.id,
          message: failure.message,
        })),
      },
      null,
      2,
    ),
  )
}

function main() {
  const result = runStaticAudit()
  printResult(result)
  if (!result.ok) {
    process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}

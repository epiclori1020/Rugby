#!/usr/bin/env bash
set -u

mode="${1:-post-write-check}"
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root" || exit 0

memory_reminder() {
  cat <<'MSG'

---
OnField Memory Closeout pruefen:
- Current State aktualisieren, wenn Sprint-Status, Hook-/Workflow-Status oder App-Zustand dauerhaft anders ist.
- Decision Log aktualisieren, wenn eine dauerhafte Produkt-, Architektur- oder Workflow-Entscheidung getroffen wurde.
- Gotchas aktualisieren, wenn eine wiederholbare Falle entdeckt wurde.
- Runtime Hooks duerfen lokale ignored Memory-Artefakte verwalten; der Agent bewertet SSOT/Current-State/Decision/Gotcha-Updates nach Governance.
---

MSG
}

changed_files() {
  {
    git diff --name-only --cached -- . ':(exclude).claude/settings.local.json' 2>/dev/null
    git diff --name-only -- . ':(exclude).claude/settings.local.json' 2>/dev/null
    git ls-files --others --exclude-standard -- . 2>/dev/null | grep -v '^.claude/settings\.local\.json$' || true
  } | sort -u
}

added_text() {
  {
    git diff --no-ext-diff --cached -- . ':(exclude).claude/settings.local.json' 2>/dev/null
    git diff --no-ext-diff -- . ':(exclude).claude/settings.local.json' 2>/dev/null
  } | awk '/^\+/ && $0 !~ /^\+\+\+/ { print substr($0, 2) }'

  changed_files | while IFS= read -r file; do
    [ -n "$file" ] || continue
    git ls-files --error-unmatch "$file" >/dev/null 2>&1 && continue
    [ -f "$file" ] || continue
    [ "$(wc -c < "$file" 2>/dev/null || echo 0)" -le 200000 ] || continue
    LC_ALL=C grep -Iq . "$file" 2>/dev/null || continue
    sed 's/^//' "$file"
  done
}

added_text_for_changed_paths() {
  pattern="$1"
  changed_files | grep -E "$pattern" | while IFS= read -r file; do
    [ -n "$file" ] || continue
    if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
      {
        git diff --no-ext-diff --cached -- "$file" 2>/dev/null
        git diff --no-ext-diff -- "$file" 2>/dev/null
      } | awk '/^\+/ && $0 !~ /^\+\+\+/ { print substr($0, 2) }'
    elif [ -f "$file" ]; then
      [ "$(wc -c < "$file" 2>/dev/null || echo 0)" -le 200000 ] || continue
      LC_ALL=C grep -Iq . "$file" 2>/dev/null || continue
      sed 's/^//' "$file"
    fi
  done
}

has_changed_path() {
  pattern="$1"
  changed_files | grep -Eq "$pattern"
}

post_write_check() {
  text="$(added_text)"
  exit_code=0

  if printf '%s\n' "$text" | grep -Eiq '(SUPABASE_SERVICE_ROLE(_KEY)?|SERVICE_ROLE_KEY)[[:space:]]*[:=]'; then
    printf '%s\n' "OnField guardrail: possible service-role secret assignment in diff. Do not commit service-role keys." >&2
    exit_code=1
  fi

  if printf '%s\n' "$text" | grep -Eq '(sb_secret_[A-Za-z0-9_=-]{20,}|sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,})'; then
    printf '%s\n' "OnField guardrail: possible API secret in diff. Remove real secrets before continuing." >&2
    exit_code=1
  fi

  if printf '%s\n' "$text" | grep -Eiq 'service_role[[:space:]_-]*(key)?[[:space:]]*[:=][[:space:]]*["'\'']?[A-Za-z0-9._=-]{20,}'; then
    printf '%s\n' "OnField guardrail: possible Supabase service-role key value in diff." >&2
    exit_code=1
  fi

  if has_changed_path '^(AGENTS\.md|docs/field-hub/|app/field-hub/|\.agents/skills/onfield|\.agents/skills/rugby-field-hub-implementation)'; then
    safety_text="$(added_text_for_changed_paths '^(AGENTS\.md|docs/field-hub/|app/field-hub/|\.agents/skills/onfield|\.agents/skills/rugby-field-hub-implementation)' | grep -Eiv '\b(keine|kein|nicht|ohne|verbot|vermeiden|riskant|no|not|without|never|forbidden|do not)\b' || true)"
    if printf '%s\n' "$safety_text" | grep -Eiq '\b(cleared|fit for play|return[- ]?to[- ]?play[[:space:]-]*(freigegeben|clearance|cleared)|diagnose|diagnosis|diagnostik|einsatzfaehig|spielfaehig)\b'; then
      printf '%s\n' "OnField warning: possible medical diagnosis or clearance wording in OnField-relevant changes. Agent must review wording." >&2
    fi
  fi

  if has_changed_path '^(docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap\.md|docs/field-hub/onfield_.*\.md|docs/field-hub/memory/index\.md|\.agents/skills/)'; then
    if ! has_changed_path '^(docs/field-hub/onfield_current_state\.md|docs/field-hub/onfield_decision_log\.md|docs/field-hub/memory/gotchas\.md)'; then
      printf '%s\n' "OnField warning: roadmap/SSOT/skill changed. Agent must explicitly run Memory Closeout and decide whether Current State, Decision Log or Gotchas need updates." >&2
    fi
  fi

  if [ "$exit_code" -eq 0 ]; then
    printf '%s\n' "OnField guardrails checked. Runtime Memory stays local; agent still owns SSOT Memory Closeout."
  fi

  return "$exit_code"
}

case "$mode" in
  memory-reminder)
    memory_reminder
    ;;
  post-write-check)
    post_write_check
    ;;
  *)
    printf '%s\n' "Usage: $0 {memory-reminder|post-write-check}" >&2
    exit 2
    ;;
esac

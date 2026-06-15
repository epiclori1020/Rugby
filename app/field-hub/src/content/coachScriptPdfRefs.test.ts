import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { pdfRefs } from './pdfRefs'
import { sessionDefinitions } from './sessions'

describe('coach script PDF references', () => {
  it('uses the new Tuesday deep playbook only for the Tuesday session', () => {
    const tuesdaySession = sessionDefinitions.find((session) => session.id === 'kw25-di-2026-06-16')
    const thursdaySession = sessionDefinitions.find((session) => session.id === 'kw25-do-2026-06-18')

    expect(pdfRefs.kw25TuesdayCoachScript).toEqual({
      label: 'Coach-Skript Dienstag V2',
      href: '/library/coach_script_dienstag_2026-06-16_v2_deep_playbook.pdf',
      sourcePath: 'docs/16_unit_1_v2_deep_playbook_2026-06-16.styled.pdf',
    })
    expect(existsSync(join(process.cwd(), 'public', pdfRefs.kw25TuesdayCoachScript.href))).toBe(true)
    expect(tuesdaySession?.pdfRefs).toContain(pdfRefs.kw25TuesdayCoachScript)
    expect(thursdaySession?.pdfRefs).not.toContain(pdfRefs.kw25TuesdayCoachScript)
  })
})

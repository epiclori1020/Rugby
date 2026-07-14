import { describe, expect, it } from 'vitest'
import { cleanupSeed, resolveKioskTarget } from './e2e-kiosk-smoke.mjs'

describe('resolveKioskTarget', () => {
  it('allows loopback without a separate auth allowlist', () => {
    expect(resolveKioskTarget('http://127.0.0.1:5180/')).toEqual({
      url: 'http://127.0.0.1:5180/',
      logUrl: 'http://127.0.0.1:5180/',
    })
  })

  it('blocks remote credential targets unless their exact HTTPS origin is allowlisted', () => {
    expect(() => resolveKioskTarget('https://beta.example.com/')).toThrow(/AUTH_ORIGIN/)
    expect(() => resolveKioskTarget('http://beta.example.com/', 'http://beta.example.com')).toThrow(/HTTPS/)
  })

  it('rejects URL credentials and sanitizes the log URL', () => {
    expect(() => resolveKioskTarget('https://coach:secret@beta.example.com/')).toThrow(/Zugangsdaten/)
    expect(
      resolveKioskTarget('https://beta.example.com/onfield/?token=secret#kiosk', 'https://beta.example.com'),
    ).toEqual({
      url: 'https://beta.example.com/onfield/?token=secret#kiosk',
      logUrl: 'https://beta.example.com/onfield/',
    })
  })
})

describe('cleanupSeed', () => {
  it('continues all exact cleanup and verification steps after an earlier failure', async () => {
    const calls = []
    let entriesDeleteFailed = false
    const supabase = {
      from(table) {
        return {
          delete() {
            return {
              async eq(column, value) {
                calls.push(`delete:${table}:${column}:${value}`)
                if (table === 'player_session_entries' && !entriesDeleteFailed) {
                  entriesDeleteFailed = true
                  return { error: new Error('temporary delete failure') }
                }
                return { error: null }
              },
            }
          },
          select() {
            return {
              async eq(column, value) {
                calls.push(`verify:${table}:${column}:${value}`)
                return { data: [], error: null }
              },
            }
          },
        }
      },
    }

    await expect(cleanupSeed(supabase, 'player-1', 'session-1')).rejects.toThrow(/Entries löschen/)
    expect(calls).toEqual([
      'delete:player_session_entries:player_id:player-1',
      'delete:players:id:player-1',
      'delete:session_logs:id:session-1',
      'verify:player_session_entries:player_id:player-1',
      'verify:players:id:player-1',
      'verify:session_logs:id:session-1',
    ])
  })
})

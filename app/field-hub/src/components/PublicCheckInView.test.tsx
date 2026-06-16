import { describe, expect, it } from 'vitest'
import { publicSubmissionErrorMessage } from '../lib/publicCheckInErrors'

describe('PublicCheckInView error mapping', () => {
  it('shows a friendly message when the submission limit is reached', () => {
    expect(publicSubmissionErrorMessage(new Error('public check-in submission limit reached'))).toBe(
      'Check-in wurde bereits mehrfach abgeschickt. Sag Arwin bitte direkt Bescheid.',
    )
  })
})

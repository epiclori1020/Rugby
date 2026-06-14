import { describe, expect, it, vi } from 'vitest'
import { prewarmPdfAssets } from './pdfAssets'

describe('prewarmPdfAssets', () => {
  it('fetches only local library PDFs for cache warmup', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }))

    await prewarmPdfAssets(['/library/a.pdf', 'https://example.test/b.pdf', '/assets/not-pdf.txt'], fetcher)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith('/library/a.pdf', { cache: 'force-cache' })
  })

  it('does not fail the UI when PDF warmup fetches fail', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('network')
    })

    await expect(prewarmPdfAssets(['/library/a.pdf'], fetcher)).resolves.toBeUndefined()
  })
})

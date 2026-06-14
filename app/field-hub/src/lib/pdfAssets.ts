type PdfFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

function isLocalLibraryPdf(href: string) {
  return href.startsWith('/library/') && href.endsWith('.pdf')
}

export async function prewarmPdfAssets(hrefs: string[], fetcher: PdfFetch = fetch) {
  await Promise.all(
    hrefs.filter(isLocalLibraryPdf).map(async (href) => {
      try {
        await fetcher(href, { cache: 'force-cache' })
      } catch {
        // PDF warmup is an optional cold-start optimization; the viewer fallback handles failures.
      }
    }),
  )
}

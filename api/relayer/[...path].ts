/**
 * Mainnet FHEVM relayer proxy.
 *
 * The Zama mainnet relayer (https://relayer.mainnet.zama.org) requires an
 * `x-api-key`. That key must never ship in the browser bundle, so the frontend
 * points the relayer SDK at `/api/relayer/v2` (same-origin) and this function
 * forwards every call upstream with the key injected from a server-side env var.
 *
 * Runs on Vercel's Edge runtime so it can stream request/response bodies (the
 * relayer exchanges sizeable ciphertext payloads) without buffering.
 *
 * Required env var: RELAYER_API_KEY  (Project Settings → Environment Variables).
 */
export const config = { runtime: 'edge' }

const UPSTREAM = 'https://relayer.mainnet.zama.org'
const PREFIX = '/api/relayer'

export default async function handler(req: Request): Promise<Response> {
  const apiKey = process.env.RELAYER_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'RELAYER_API_KEY is not configured on the server.' }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    )
  }

  const url = new URL(req.url)
  const subpath = url.pathname.startsWith(PREFIX)
    ? url.pathname.slice(PREFIX.length)
    : url.pathname
  const target = `${UPSTREAM}${subpath}${url.search}`

  // Forward the client's headers, swapping in the secret key. Drop hop-by-hop /
  // host headers so fetch sets correct ones for the upstream.
  const headers = new Headers(req.headers)
  headers.set('x-api-key', apiKey)
  headers.delete('host')
  headers.delete('content-length')

  const method = req.method.toUpperCase()
  const hasBody = method !== 'GET' && method !== 'HEAD'

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? req.body : undefined,
      // Required by the Fetch standard when streaming a request body.
      // @ts-expect-error - `duplex` is valid at runtime but missing in the DOM types.
      duplex: 'half',
      redirect: 'manual',
    })
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to reach the upstream relayer.' }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    )
  }

  // Stream the upstream response straight back. `fetch` has already decoded the
  // body, so strip encoding/length headers that would otherwise mismatch.
  const respHeaders = new Headers(upstream.headers)
  respHeaders.delete('content-encoding')
  respHeaders.delete('content-length')
  respHeaders.delete('transfer-encoding')

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  })
}

interface TokenGlyphProps {
  symbol: string
  address: string
  size?: number
  /** Render in the dark "confidential" treatment (yellow on ink). */
  confidential?: boolean
}

function hueFromAddress(address: string): number {
  let h = 0
  for (let i = 2; i < address.length; i++) h = (h * 31 + address.charCodeAt(i)) % 360
  return h
}

/** A deterministic, colorful token avatar derived from the token address. */
export function TokenGlyph({ symbol, address, size = 38, confidential = false }: TokenGlyphProps) {
  const hue = hueFromAddress(address)
  const letters = symbol.replace(/^c/, '').slice(0, 2).toUpperCase()

  const style = confidential
    ? { background: '#111314', color: '#ffd208' }
    : { background: `hsl(${hue} 75% 92%)`, color: `hsl(${hue} 55% 32%)` }

  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display font-bold"
      style={{ width: size, height: size, fontSize: size * 0.34, ...style }}
      aria-hidden
    >
      {letters}
    </span>
  )
}

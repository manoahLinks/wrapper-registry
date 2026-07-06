interface BrandMarkProps {
  /** Pixel size of the square glyph. */
  size?: number
  withWordmark?: boolean
}

/** The lock glyph + wordmark used in the header and footer. */
export function BrandMark({ size = 100, withWordmark = true }: BrandMarkProps) {
  return (
    <div className="flex items-center">
      <span
        className=""
        style={{ width: size, height: size }}
        aria-hidden
      >
        <img src="../../public/tacos-icon.png" alt="Wrapper Registry" className="w-full h-full object-contain" />
      </span>
      {withWordmark && (
        <div className="hidden leading-none sm:block">
          <div className="font-display text-[20px] font-extrabold tracking-tight text-ink">
            Tacos
          </div>
          <div className="mt-[3px] font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-ink-faint">
            Confidential Wrapper Registry · Zama
          </div>
        </div>
      )}
    </div>
  )
}

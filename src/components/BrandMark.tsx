interface BrandMarkProps {
  /** Pixel size of the square glyph. */
  size?: number
  withWordmark?: boolean
}

/** The lock glyph + wordmark used in the header and footer. */
export function BrandMark({ size = 36, withWordmark = true }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-[11px]">
      <span
        className="grid shrink-0 place-items-center rounded-[9px] bg-ink"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
          <rect x="4.5" y="10.5" width="15" height="10.5" rx="2" stroke="#FFD000" strokeWidth="2" />
          <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" stroke="#FFD000" strokeWidth="2" />
          <circle cx="12" cy="15.5" r="1.6" fill="#FFD000" />
        </svg>
      </span>
      {withWordmark && (
        <div className="hidden leading-none sm:block">
          <div className="font-display text-[15px] font-extrabold tracking-tight text-ink">
            Wrapper Registry
          </div>
          <div className="mt-[3px] font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-ink-faint">
            Confidential · Zama
          </div>
        </div>
      )}
    </div>
  )
}

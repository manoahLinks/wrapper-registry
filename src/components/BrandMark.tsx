interface BrandMarkProps {
  /** Pixel size of the square glyph. */
  size?: number
  withWordmark?: boolean
}

/** The lock glyph + wordmark used in the header and footer. */
export function BrandMark({ size = 34, withWordmark = true }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid place-items-center rounded-[9px] bg-ink shadow-card"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 32 32" fill="none">
          <path
            d="M16 6.5c-3.6 0-6.5 2.9-6.5 6.5v1.4h-.6c-.6 0-1 .5-1 1V24c0 .6.5 1 1 1h14.2c.6 0 1-.5 1-1v-8.6c0-.6-.5-1-1-1h-.6V13c0-3.6-2.9-6.5-6.5-6.5Zm3.3 7.9h-6.6V13a3.3 3.3 0 0 1 6.6 0v1.4Z"
            fill="#ffd208"
          />
          <circle cx="16" cy="19" r="1.9" fill="#111314" />
        </svg>
      </span>
      {withWordmark && (
        <div className="leading-none">
          <div className="font-display text-[15px] font-bold tracking-tight text-ink">
            Wrapper Registry
          </div>
          <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
            Confidential · Zama
          </div>
        </div>
      )}
    </div>
  )
}

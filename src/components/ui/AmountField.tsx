interface AmountFieldProps {
  value: string
  onChange: (v: string) => void
  symbol: string
  /** Optional helper shown under the field (e.g. balance, limit). */
  hint?: React.ReactNode
  /** Called when the user taps "Max". */
  onMax?: () => void
  disabled?: boolean
  autoFocus?: boolean
}

/** A token amount input with symbol affix and optional Max button. */
export function AmountField({
  value,
  onChange,
  symbol,
  hint,
  onMax,
  disabled,
  autoFocus,
}: AmountFieldProps) {
  function sanitize(raw: string) {
    // Allow only a non-negative decimal number.
    const cleaned = raw.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned
    onChange(normalized)
  }

  return (
    <div>
      <div
        className={`flex items-center gap-2.5 rounded-[12px] border bg-paper-soft px-3.5 py-3.5 transition-colors focus-within:border-ink ${
          disabled ? 'border-line opacity-60' : 'border-line'
        }`}
      >
        <input
          inputMode="decimal"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={(e) => sanitize(e.target.value)}
          placeholder="0.0"
          className="tabular w-full min-w-0 bg-transparent font-mono text-[28px] font-bold text-ink outline-none placeholder:text-ink-faint"
        />
        {onMax && (
          <button
            type="button"
            onClick={onMax}
            disabled={disabled}
            className="rounded-[7px] border border-line bg-paper-card px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-ink hover:border-ink"
          >
            Max
          </button>
        )}
        <span className="font-mono text-sm font-bold text-ink-soft">{symbol}</span>
      </div>
      {hint && <div className="mt-1.5 text-xs text-ink-muted">{hint}</div>}
    </div>
  )
}

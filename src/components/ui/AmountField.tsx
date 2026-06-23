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
        className={`flex items-center gap-2 rounded-[12px] border bg-paper-soft px-3.5 py-3 transition-colors focus-within:border-ink/30 ${
          disabled ? 'border-line opacity-60' : 'border-line-strong'
        }`}
      >
        <input
          inputMode="decimal"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={(e) => sanitize(e.target.value)}
          placeholder="0.0"
          className="tabular w-full bg-transparent font-mono text-xl text-ink outline-none placeholder:text-ink-faint"
        />
        {onMax && (
          <button
            type="button"
            onClick={onMax}
            disabled={disabled}
            className="rounded-md bg-zama-soft-yellow px-2 py-1 text-xs font-bold uppercase tracking-wide text-ink hover:bg-zama-light-yellow"
          >
            Max
          </button>
        )}
        <span className="font-display text-sm font-bold text-ink-muted">{symbol}</span>
      </div>
      {hint && <div className="mt-1.5 text-xs text-ink-muted">{hint}</div>}
    </div>
  )
}

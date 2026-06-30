import { WrapLoop } from '@/components/WrapLoop'

/** Allow only a non-negative decimal number (mirrors AmountField). */
export function sanitizeDecimal(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned
}

function FieldCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[12px] border border-line bg-paper-soft p-[15px]">{children}</div>
}

interface AmountConvertProps {
  fromLabel: string
  balanceText: string
  value: string
  onValue: (v: string) => void
  onMax?: () => void
  fromSymbol: string
  toLabel: string
  receiveText: string
  toSymbol: string
  /** Colour for the receive amount (defaults to ink). */
  receiveColor?: string
  disabled?: boolean
  autoFocus?: boolean
}

/** The "from" card → ↓ → "to" card amount step used by wrap & unwrap. */
export function AmountConvert({
  fromLabel,
  balanceText,
  value,
  onValue,
  onMax,
  fromSymbol,
  toLabel,
  receiveText,
  toSymbol,
  receiveColor = '#0B0B0C',
  disabled,
  autoFocus,
}: AmountConvertProps) {
  return (
    <>
      <FieldCard>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">{fromLabel}</span>
          <span className="font-mono text-[11px] text-ink-faint">balance {balanceText}</span>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <input
            inputMode="decimal"
            autoFocus={autoFocus}
            disabled={disabled}
            value={value}
            onChange={(e) => onValue(sanitizeDecimal(e.target.value))}
            placeholder="0.0"
            className="tabular w-full min-w-0 bg-transparent font-mono text-[28px] font-bold text-ink outline-none placeholder:text-ink-faint disabled:opacity-60"
          />
          {onMax && (
            <button
              type="button"
              onClick={onMax}
              className="rounded-[7px] border border-line bg-paper-card px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide hover:border-ink"
            >
              Max
            </button>
          )}
          <span className="font-mono text-sm font-bold text-ink-soft">{fromSymbol}</span>
        </div>
      </FieldCard>

      <div className="my-3 flex items-center justify-center">
        <div className="grid h-[30px] w-[30px] place-items-center rounded-full border border-line bg-paper-card text-sm text-line-dashed">
          ↓
        </div>
      </div>

      <FieldCard>
        <div className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">{toLabel}</div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="font-mono text-[28px] font-bold" style={{ color: receiveColor }}>
            {receiveText}
          </span>
          <span className="font-mono text-sm font-bold text-ink-soft">{toSymbol}</span>
        </div>
      </FieldCard>
    </>
  )
}

export function AmountError({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3.5 flex items-center gap-2 rounded-[10px] border border-state-danger/25 bg-state-danger/5 px-3 py-2.5 text-[12.5px] font-semibold text-state-danger">
      <span>⚠</span>
      {children}
    </div>
  )
}

export function PrivacyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-[7px] text-[11px] text-ink-dim">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="#A8A294" strokeWidth="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#A8A294" strokeWidth="2" />
      </svg>
      {children}
    </div>
  )
}

export type StageState = 'todo' | 'active' | 'done'
export interface Stage {
  key: string
  title: string
  detail?: string
  state: StageState
}

function StageRow({ stage }: { stage: Stage }) {
  const { state, title, detail } = stage
  const shell =
    state === 'done'
      ? 'border-state-success/25 bg-state-success/[0.07]'
      : state === 'active'
        ? 'border-line bg-paper-soft'
        : 'border-line bg-paper-card opacity-70'
  return (
    <div className={`flex items-center gap-3 rounded-[11px] border px-3.5 py-[13px] ${shell}`}>
      <div className="grid h-[22px] w-[22px] shrink-0 place-items-center">
        {state === 'done' ? (
          <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-state-success text-xs text-white">✓</span>
        ) : state === 'active' ? (
          <span className="inline-block h-[18px] w-[18px] rounded-full border-2 border-line" style={{ borderTopColor: '#0B0B0C', animation: 'wlSpin .7s linear infinite' }} />
        ) : (
          <span className="inline-block h-[18px] w-[18px] rounded-full border-2 border-line" />
        )}
      </div>
      <div className="flex-1">
        <div className={`text-[13.5px] font-bold ${state === 'todo' ? 'text-ink-faint' : 'text-ink'}`}>{title}</div>
        {detail && <div className="mt-0.5 text-[11.5px] text-ink-faint">{detail}</div>}
      </div>
      {state === 'active' && (
        <span className="animate-pulse-soft font-mono text-[10px] text-ink-faint">pending</span>
      )}
    </div>
  )
}

interface PendingStepProps {
  stages: Stage[]
  foot?: string
  /** Show the WrapLoop morph above the stages (wrap/unwrap). */
  morph?: { sym: string; csym: string }
}

export function PendingStep({ stages, foot, morph }: PendingStepProps) {
  return (
    <>
      {morph && (
        <div className="mb-3.5 rounded-[13px] border border-line bg-paper-soft p-1.5 pb-0.5">
          <WrapLoop sym={morph.sym} csym={morph.csym} height={170} />
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {stages.map((s) => (
          <StageRow key={s.key} stage={s} />
        ))}
      </div>
      {foot && <div className="mt-4 text-center font-mono text-[11.5px] text-ink-dim">{foot}</div>}
    </>
  )
}

interface DoneStepProps {
  title: string
  sub: string
  /** A dark "DECRYPTED BALANCE / released" reveal box. */
  reveal?: string
  txHash?: string
  txUrl?: string
  onDone: () => void
}

export function DoneStep({ title, sub, reveal, txHash, txUrl, onDone }: DoneStepProps) {
  return (
    <>
      <div className="px-0 pb-1 pt-1.5 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-state-success/25 bg-state-success/[0.08]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7" stroke="#16A34A" strokeWidth="2.6" />
          </svg>
        </div>
        <div className="mt-4 text-lg font-extrabold">{title}</div>
        <div className="mt-1.5 text-[13px] leading-[1.5] text-ink-muted">{sub}</div>
      </div>

      {reveal && (
        <div className="mt-[18px] rounded-[13px] bg-ink p-[18px] text-center">
          <div className="font-mono text-[10px] tracking-[0.12em] text-ink-faint">RELEASED</div>
          <div className="mt-2 font-mono text-[30px] font-bold text-zama-yellow">{reveal}</div>
        </div>
      )}

      {txHash && (
        <a
          href={txUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-[18px] flex items-center justify-between rounded-[11px] border border-line bg-paper-soft px-3.5 py-3 font-mono text-xs text-ink-soft hover:border-ink"
        >
          <span className="text-ink-faint">tx</span>
          <span>{txHash.slice(0, 10)}…{txHash.slice(-8)} ↗</span>
        </a>
      )}

      <button onClick={onDone} className="btn-dark mt-3 w-full py-3.5 text-[14.5px]">
        Done
      </button>
    </>
  )
}

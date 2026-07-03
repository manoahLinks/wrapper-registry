interface WrapLoopProps {
  /** Public-token symbol shown on the plaintext face. */
  sym?: string
  /** Confidential-token symbol shown on the shielded face. */
  csym?: string
  /** Show the framed card chrome (header + status line). Off for embeds. */
  chrome?: boolean
  /** Override the stage height (default 158px). */
  height?: number
}

/**
 * The "confidential wrap engine" graphic: a token travels between the public
 * ERC-20 station and the shielded ERC-7984 station, morphing from a plaintext
 * face into an encrypted one on the way out and back on the way in. Pure
 * CSS/SVG animation (keyframes live in index.css under the `wl*` prefix).
 */
export function WrapLoop({ sym = 'USDC', csym = 'cUSDC', chrome = false, height = 158 }: WrapLoopProps) {
  return (
    <div
      className="w-full overflow-hidden rounded-card border border-line bg-paper-card"
      style={{ fontFamily: "'JetBrains Mono', monospace", padding: '20px 22px 18px', boxShadow: '0 14px 38px rgba(28,22,8,.08)', animation: 'wlIn .7s cubic-bezier(.2,.7,.2,1) .15s both' }}
    >
      {chrome && (
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-ink-muted">
            <span className="text-line-dashed">▸</span>confidential shield engine
          </div>
          <div className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] text-ink-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-state-success" style={{ animation: 'wlBlink 1.8s ease-in-out infinite' }} />
            LIVE
          </div>
        </div>
      )}

      {/* stage */}
      <div className="relative mx-auto mt-1.5 w-[360px] max-w-full" style={{ height }}>
        {/* direction labels */}
        <div className="absolute left-[120px] top-0 h-4 w-[120px] text-center">
          <span className="absolute inset-0 text-[11px] font-bold tracking-[0.12em]" style={{ color: '#7A6B00', animation: 'wlWrapOn 7s ease-in-out infinite' }}>shield →</span>
          <span className="absolute inset-0 text-[11px] font-bold tracking-[0.12em] text-ink-muted" style={{ animation: 'wlUnwrapOn 7s ease-in-out infinite' }}>← unshield</span>
        </div>

        {/* flow track */}
        <div className="absolute left-[112px] top-[60px] h-0.5 w-[136px]">
          <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#0B0B0C 0 7px,transparent 7px 14px)', animation: 'wlDashRight .9s linear infinite, wlWrapOn 7s ease-in-out infinite' }} />
          <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#57534B 0 7px,transparent 7px 14px)', animation: 'wlDashLeft .9s linear infinite, wlUnwrapOn 7s ease-in-out infinite' }} />
        </div>

        {/* station glows */}
        <div className="absolute left-[30px] top-6 h-[72px] w-[72px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,208,0,.4), transparent 68%)', animation: 'wlLeftGlow 7s ease-in-out infinite' }} />
        <div className="absolute left-[258px] top-6 h-[72px] w-[72px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(11,11,12,.16), transparent 68%)', animation: 'wlRightGlow 7s ease-in-out infinite' }} />

        {/* traveling token */}
        <div className="absolute left-[30px] top-6 h-[72px] w-[72px]" style={{ animation: 'wlMove 7s cubic-bezier(.55,.05,.3,1) infinite' }}>
          <div className="absolute -inset-[13px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,208,0,.32), transparent 70%)', animation: 'wlShield 7s ease-in-out infinite' }} />
          <div className="absolute -inset-[7px] rounded-full border-[1.5px] border-dashed" style={{ borderColor: '#C79A00', animation: 'wlSpin 5s linear infinite, wlSealOp 7s ease-in-out infinite' }} />
          {/* plaintext face */}
          <div className="absolute inset-0 flex items-center justify-center rounded-full border border-ink bg-zama-yellow text-sm font-bold text-ink" style={{ animation: 'wlPlain 7s ease-in-out infinite' }}>{sym}</div>
          {/* shielded face */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full border border-ink bg-ink" style={{ animation: 'wlCipher 7s ease-in-out infinite' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="1.5" stroke="#FFD000" strokeWidth="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#FFD000" strokeWidth="2" /></svg>
            <span className="text-[10px] font-bold tracking-[0.02em] text-zama-yellow">{csym}</span>
            <div className="absolute left-0 right-0 h-0.5 bg-zama-yellow" style={{ boxShadow: '0 0 9px 1px rgba(255,208,0,.8)', animation: 'wlScan 7s ease-in-out infinite' }} />
          </div>
        </div>

        {/* station captions */}
        <div className="absolute left-1.5 top-[108px] w-[120px] text-center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mb-[3px] inline-block"><rect x="5" y="11" width="14" height="9" rx="1.5" stroke="#0B0B0C" strokeWidth="1.8" /><path d="M8 11V8a4 4 0 0 1 7.5-1.2" stroke="#0B0B0C" strokeWidth="1.8" /></svg>
          <div className="text-[11px] font-bold text-ink">ERC-20</div>
          <div className="mt-0.5 text-[9.5px] tracking-[0.12em] text-ink-dim">PUBLIC</div>
        </div>
        <div className="absolute left-[234px] top-[108px] w-[120px] text-center">
          <span className="inline-block" style={{ animation: 'wlLockPulse 7s ease-in-out infinite' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mb-[3px] inline-block"><rect x="5" y="11" width="14" height="9" rx="1.5" stroke="#0B0B0C" strokeWidth="1.8" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#0B0B0C" strokeWidth="1.8" /></svg>
          </span>
          <div className="text-[11px] font-bold text-ink">ERC-7984</div>
          <div className="mt-0.5 text-[9.5px] tracking-[0.12em] text-ink-dim">SHIELDED</div>
        </div>
      </div>

      {chrome && (
        <div className="relative mt-2 h-[18px] text-center">
          <span className="absolute inset-0 text-[11px]" style={{ color: '#7A6B00', animation: 'wlWrapOn 7s ease-in-out infinite' }}>shielding · {sym} → {csym} · encrypted on-chain</span>
          <span className="absolute inset-0 text-[11px] text-ink-muted" style={{ animation: 'wlUnwrapOn 7s ease-in-out infinite' }}>unshielding · {csym} → {sym} · decrypted to you</span>
        </div>
      )}
    </div>
  )
}

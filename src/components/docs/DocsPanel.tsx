import { useActiveChain } from '@/hooks/useActiveChain'

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="wr-scroll mt-3 overflow-x-auto rounded-[12px] bg-ink p-4 font-mono text-[11.5px] leading-[1.7] text-[#E8E3D6]">
      {children}
    </pre>
  )
}

function SourceRow({ n, name, where, scope, primary }: { n: number; name: string; where: string; scope: string; primary?: boolean }) {
  return (
    <div className="flex items-start gap-3 border-t border-line py-3 first:border-t-0">
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-[11px] font-bold ${primary ? 'bg-zama-yellow text-ink' : 'bg-paper-sunken text-ink-muted'}`}>{n}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
          {name}
          {primary && <span className="rounded border border-zama-yellow bg-zama-soft-yellow px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em]">primary</span>}
        </div>
        <div className="mt-0.5 font-mono text-[11.5px] text-ink-faint">{where}</div>
      </div>
      <div className="shrink-0 text-right text-[11px] text-ink-muted">{scope}</div>
    </div>
  )
}

function Method({ tag, tagTone, title, children }: { tag: string; tagTone: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5">
        <span className={`rounded-md border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${tagTone}`}>{tag}</span>
        <h4 className="font-display text-[15px] font-extrabold tracking-tight text-ink">{title}</h4>
      </div>
      <div className="mt-2.5 space-y-2 text-[13.5px] leading-[1.55] text-ink-muted">{children}</div>
    </div>
  )
}

export function DocsPanel() {
  const { config } = useActiveChain()
  const registry = config.customRegistryAddress
  const factory = config.factoryAddress

  return (
    <section id="docs" className="mx-auto max-w-3xl py-14">
      <div className="pill mb-4 border-zama-yellow/60 bg-zama-soft-yellow">
        <span className="h-1.5 w-1.5 rounded-full bg-zama-yellow" />
        Docs
      </div>
      <h2 className="font-display text-[30px] font-extrabold tracking-tight text-ink">Adding a confidential wrapper</h2>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.6] text-ink-muted">
        A confidential wrapper is a deployed ERC‑7984 contract that shields exactly one ERC‑20. The
        registry that lists these pairs is <b className="text-ink">hybrid</b>: the official on‑chain
        registry is the source of truth, and we layer additional sources on top so you can add your
        own pairs — because Zama's registry can't accept them (below).
      </p>

      {/* Hybrid sourcing */}
      <div className="mt-8">
        <h3 className="font-display text-lg font-bold text-ink">How the registry is sourced</h3>
        <p className="mt-1.5 text-[13.5px] text-ink-muted">
          Pairs are deduplicated by wrapper address; the first source to declare a wrapper wins, so
          nothing below can override an official entry. All token metadata is read live from chain.
        </p>
        <div className="mt-3 rounded-card border border-line bg-paper-card p-4">
          <SourceRow n={1} name="Official Zama registry" where="on-chain · getTokenConfidentialTokenPairs()" scope="everyone" primary />
          <SourceRow n={2} name="Community registry (ours)" where="on-chain · WrapperRegistry" scope="everyone" />
          <SourceRow n={3} name="Local config" where="src/config/pairs.config.ts" scope="ships with app" />
          <SourceRow n={4} name="Browser-saved custom" where="localStorage · per user, per chain" scope="just you" />
        </div>
      </div>

      {/* The gating */}
      <div className="mt-8">
        <h3 className="font-display text-lg font-bold text-ink">The gating: Zama's official registry</h3>
        <p className="mt-1.5 text-[13.5px] leading-[1.6] text-ink-muted">
          Zama's <span className="font-mono text-[12.5px]">ConfidentialTokenWrappersRegistry</span> is
          <b className="text-ink"> owner‑gated</b> — its docs state <i>"all administrative actions are
          restricted to the registry owner."</i> Registration is a single owner‑only call:
        </p>
        <Code>{`// onlyOwner — regular users cannot call this
registry.registerConfidentialToken(
  erc20TokenAddress,
  confidentialWrapperAddress
);`}</Code>
        <p className="mt-3 text-[13.5px] text-ink-muted">The confidential token must:</p>
        <ul className="mt-1.5 space-y-1 text-[13.5px] text-ink-muted">
          <li>• implement <b className="text-ink">ERC‑165</b> (<span className="font-mono text-[12px]">supportsInterface</span>)</li>
          <li>• support the <b className="text-ink">ERC‑7984</b> interface — selector <span className="font-mono text-[12px]">0x4958f2a4</span></li>
          <li>• not already be associated with another token (no duplicates)</li>
        </ul>
        <p className="mt-3 text-[13.5px] text-ink-muted">
          Reverts: <span className="font-mono text-[11.5px]">NotERC7984</span>,{' '}
          <span className="font-mono text-[11.5px]">ConfidentialTokenDoesNotSupportERC165</span>,{' '}
          <span className="font-mono text-[11.5px]">ConfidentialTokenAlreadyAssociatedWithToken</span>,{' '}
          <span className="font-mono text-[11.5px]">TokenAlreadyAssociatedWithConfidentialToken</span>, plus a zero‑address check.
        </p>
        <p className="mt-3 text-[13px]">
          <a href="https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry.md" target="_blank" rel="noreferrer" className="font-semibold text-ink underline underline-offset-2 hover:text-zama-orange">
            Zama · Wrapper Registry docs ↗
          </a>
        </p>
      </div>

      {/* Why ours */}
      <div className="mt-8 rounded-card border border-state-info/30 bg-state-info/[0.06] p-5">
        <h3 className="font-display text-lg font-bold text-ink">Why we built our own registry</h3>
        <p className="mt-1.5 text-[13.5px] leading-[1.6] text-ink-muted">
          Because the official registry is owner‑gated, an ordinary user or dApp <b className="text-ink">cannot
          add a pair to it</b> — only Zama can. To let anyone contribute pairs, we deployed our own{' '}
          <b className="text-ink">permissionless</b> <span className="font-mono text-[12.5px]">WrapperRegistry</span>{' '}
          that mirrors Zama's read shape (same <span className="font-mono text-[12px]">getTokenConfidentialTokenPairs()</span>),
          so the app reads both with one code path. Ours is open but still <b className="text-ink">validated</b>:
          it requires <span className="font-mono text-[12px]">confidentialToken.underlying() == token</span> and
          rejects duplicates. A companion <span className="font-mono text-[12.5px]">ConfidentialWrapperFactory</span>{' '}
          deploys a wrapper and registers it in one transaction — that's the ⚡ Deploy a wrapper button.
        </p>
        {(registry || factory) && (
          <div className="mt-3 space-y-1 font-mono text-[11.5px] text-ink-muted">
            {registry && <div>registry · {registry}</div>}
            {factory && <div>factory&nbsp;&nbsp;· {factory}</div>}
          </div>
        )}
      </div>

      {/* The four ways */}
      <div className="mt-8">
        <h3 className="font-display text-lg font-bold text-ink">Four ways to add a pair</h3>
        <div className="mt-3 grid gap-3">
          <Method tag="Recommended" tagTone="border-zama-yellow bg-zama-soft-yellow text-ink" title="⚡ Deploy a wrapper — on-chain, for everyone">
            <p>No wrapper yet? Click <b className="text-ink">⚡ Deploy a wrapper</b>, paste the ERC‑20 address. The factory deploys an ERC‑7984 wrapper and registers the pair in our community registry — it appears for all users with a <b className="text-ink">Community</b> badge.</p>
            <Code>{`factory.createWrapper(erc20, "Confidential X", "cX", "");
// or, for an existing wrapper:
registry.register(erc20, existingWrapper);`}</Code>
          </Method>
          <Method tag="Per user" tagTone="border-state-info/40 bg-state-info/10 text-ink-soft" title="＋ Add a pair — browser-saved">
            <p>Track any already‑deployed ERC‑7984 wrapper privately. Paste the wrapper address; we read <span className="font-mono text-[12px]">underlying()</span> to derive the ERC‑20 and validate it. Stored in your browser (per chain), removable via the card's ×.</p>
          </Method>
          <Method tag="Default" tagTone="border-line bg-paper-soft text-ink-muted" title="Local config — ship a pair with the app">
            <p>Add an entry to <span className="font-mono text-[12px]">LOCAL_PAIRS</span> in <span className="font-mono text-[12px]">src/config/pairs.config.ts</span>. Merged on top of the on‑chain registry, rendered with a <b className="text-ink">Local</b> badge.</p>
            <Code>{`export const LOCAL_PAIRS: LocalPair[] = [
  { erc20: '0x…', confidential: '0x…', label: 'My dev token' },
]`}</Code>
          </Method>
          <Method tag="Official" tagTone="border-line bg-paper-soft text-ink-muted" title="Zama registry — owner-gated">
            <p>Pairs Zama registers appear <b className="text-ink">automatically</b> as the primary source — no app change. This is the owner‑only path described above; it's how cUSDC, cUSDT, cWETH … already show up.</p>
          </Method>
        </div>
      </div>
    </section>
  )
}

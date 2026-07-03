import { useMemo, useState } from 'react'
import { useChainId, useReadContracts } from 'wagmi'
import { decodeEventLog, isAddress, zeroAddress, type Address } from 'viem'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useTxRunner } from '@/hooks/useTxRunner'
import { useActiveChain } from '@/hooks/useActiveChain'
import { useCustomPairs } from '@/hooks/useCustomPairs'
import { parseTxError } from '@/lib/errors'
import { explorerTx, shortAddress } from '@/lib/format'
import { erc20Abi } from '@/abi/erc20'
import { wrapperAbi } from '@/abi/wrapper'
import { factoryAbi } from '@/abi/factory'
import { communityRegistryAbi } from '@/abi/customRegistry'
import { AmountError, PendingStep, DoneStep, type Stage } from './steps'

type Mode = 'deploy' | 'register' | 'track'

interface AddPairModalProps {
  open: boolean
  onClose: () => void
  /** Lowercased confidential (ERC-7984) addresses already in the grid. */
  known: Set<string>
  /** Lowercased ERC-20 addresses already paired in the grid. */
  knownErc20: Set<string>
  /** Refetch registries so a new on-chain pair appears. */
  onChanged: () => void
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mt-[18px] font-mono text-[11px] tracking-[0.05em] text-ink-faint">{children}</div>
}

function PasteField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  async function paste() {
    try {
      const t = await navigator.clipboard.readText()
      if (t) onChange(t.trim())
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="mt-2 flex h-[46px] items-center gap-2.5 rounded-[11px] border border-line bg-paper-soft px-3.5 focus-within:border-ink">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoFocus
        className="w-full bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-ink-dim"
      />
      <button onClick={paste} className="shrink-0 rounded-md border border-line bg-paper-card px-2 py-1 font-mono text-[10px] font-bold hover:border-ink">
        PASTE
      </button>
    </div>
  )
}

function DetectedBox({ title, sub }: { title: React.ReactNode; sub: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-[10px] border border-state-success/25 bg-state-success/[0.07] px-3 py-2.5 text-[12px] text-state-success">
      <div className="flex items-center gap-2 font-semibold">
        <span>✓</span> {title}
      </div>
      <div className="mt-1 pl-6 font-mono text-[11px] text-ink-muted">{sub}</div>
    </div>
  )
}

/** Read an ERC-7984 wrapper: underlying(), symbol, confidentialBalanceOf(0). */
function useWrapperProbe(wrapper: Address | undefined, chainId: number, enabled: boolean) {
  const { data, isLoading } = useReadContracts({
    contracts: wrapper
      ? [
          { address: wrapper, abi: wrapperAbi, functionName: 'underlying', chainId },
          { address: wrapper, abi: wrapperAbi, functionName: 'symbol', chainId },
          { address: wrapper, abi: wrapperAbi, functionName: 'confidentialBalanceOf', args: [zeroAddress], chainId },
        ]
      : [],
    query: { enabled: !!wrapper && enabled },
  })
  return {
    underlying: data?.[0]?.result as Address | undefined,
    symbol: data?.[1]?.result as string | undefined,
    isErc7984: data ? data[2]?.status === 'success' && data[0]?.status === 'success' : undefined,
    isLoading,
  }
}

// ---------------------------------------------------------------------------
// Mode 1 — Deploy a new wrapper (ERC-20 → factory → community registry)
// ---------------------------------------------------------------------------

function DeployForm({ knownErc20, factory, onChanged, onClose, setBusy }: {
  knownErc20: Set<string>
  factory: Address
  onChanged: () => void
  onClose: () => void
  setBusy: (b: boolean) => void
}) {
  const chainId = useChainId()
  const toast = useToast()
  const { run } = useTxRunner()
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [deployed, setDeployed] = useState<string | null>(null)

  const value = input.trim()
  const valid = isAddress(value)
  const erc20 = valid ? (value as Address) : undefined
  const dup = valid && knownErc20.has(value.toLowerCase())

  const { data, isLoading } = useReadContracts({
    contracts: erc20
      ? [
          { address: erc20, abi: erc20Abi, functionName: 'symbol', chainId },
          { address: erc20, abi: erc20Abi, functionName: 'name', chainId },
          { address: erc20, abi: erc20Abi, functionName: 'decimals', chainId },
        ]
      : [],
    query: { enabled: !!erc20 },
  })
  const symbol = data?.[0]?.result as string | undefined
  const name = data?.[1]?.result as string | undefined
  const decimals = data?.[2]?.result as number | undefined
  const isErc20 = data ? data[0]?.status === 'success' && data[2]?.status === 'success' : undefined
  const detected = !!erc20 && isErc20 === true
  const cName = `Confidential ${name ?? symbol ?? 'Token'}`
  const cSymbol = `c${symbol ?? 'TKN'}`

  async function deploy() {
    if (!erc20 || !detected) return
    setErrorMsg(null)
    setPhase('busy')
    setBusy(true)
    try {
      const { hash, receipt } = await run({ address: factory, abi: factoryAbi, functionName: 'createWrapper', args: [erc20, cName, cSymbol, ''], chainId })
      setTxHash(hash)
      let wrapper: string | undefined
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({ abi: factoryAbi, data: log.data, topics: log.topics })
          if (ev.eventName === 'WrapperCreated') { wrapper = (ev.args as { confidentialToken: string }).confidentialToken; break }
        } catch { /* not our event */ }
      }
      setDeployed(wrapper ?? null)
      setPhase('done')
      onChanged()
      toast.push({ kind: 'success', title: `Deployed ${cSymbol}`, description: 'Wrapper deployed and registered.', txHash: hash })
    } catch (e) {
      setPhase('error')
      setBusy(false)
      setErrorMsg(parseTxError(e))
      toast.push({ kind: 'error', title: 'Deploy failed', description: parseTxError(e) })
    }
  }

  if (phase === 'done') {
    return (
      <DoneStep
        title={`Deployed ${cSymbol}`}
        sub={deployed ? `Wrapper live at ${shortAddress(deployed, 6)} and added to the community registry.` : 'Wrapper deployed and registered.'}
        txHash={txHash ?? undefined}
        txUrl={txHash ? explorerTx(txHash, chainId) : undefined}
        onDone={onClose}
      />
    )
  }
  if (phase === 'busy') {
    return <PendingStep stages={[{ key: 'deploy', title: `Deploy ${cSymbol}`, detail: 'Deploys the wrapper and registers the pair on-chain', state: 'active' as const } as Stage]} foot="Deploying an FHE contract takes a moment — confirm in your wallet" />
  }
  return (
    <>
      <p className="text-[13px] leading-[1.55] text-ink-muted">
        Paste an <b className="text-ink">ERC-20</b> with no wrapper yet. We deploy a confidential wrapper and register the pair on-chain — visible to everyone.
      </p>
      <FieldLabel>ERC-20 TOKEN ADDRESS</FieldLabel>
      <PasteField value={input} onChange={setInput} placeholder="0x…" />
      {detected && <DetectedBox title={<>{symbol} · {decimals} decimals</>} sub={<>will deploy <b className="text-ink-soft">{cSymbol}</b> — {cName}</>} />}
      {value && !valid && <AmountError>That doesn't look like a valid address.</AmountError>}
      {isLoading && <p className="mt-3 text-[12.5px] text-ink-muted">Reading token…</p>}
      {valid && isErc20 === false && <AmountError>Not a readable ERC-20 (no symbol / decimals).</AmountError>}
      {phase === 'error' && errorMsg && <AmountError>{errorMsg}</AmountError>}
      {detected && dup && <p className="mt-2.5 text-center text-[11.5px] text-state-warn">This ERC-20 already has a wrapper — deploying makes another one.</p>}
      <button onClick={deploy} disabled={!detected} className="btn-primary mt-4 w-full py-3.5 text-[14.5px]">
        {phase === 'error' ? 'Try again' : `Deploy ${detected ? cSymbol : 'wrapper'}`}
      </button>
      <p className="mt-3 text-center text-[11px] text-ink-dim">Deploying a confidential contract costs gas — free on Sepolia, real on mainnet.</p>
    </>
  )
}

// ---------------------------------------------------------------------------
// Mode 2 — Register an existing wrapper into the community registry (on-chain)
// ---------------------------------------------------------------------------

function RegisterForm({ known, registry, onChanged, onClose, setBusy }: {
  known: Set<string>
  registry: Address
  onChanged: () => void
  onClose: () => void
  setBusy: (b: boolean) => void
}) {
  const chainId = useChainId()
  const toast = useToast()
  const { run } = useTxRunner()
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const value = input.trim()
  const valid = isAddress(value)
  const wrapper = valid ? (value as Address) : undefined
  const dup = valid && known.has(value.toLowerCase())
  const probe = useWrapperProbe(wrapper, chainId, valid && !dup)
  const detected = !!wrapper && !dup && probe.isErc7984 === true && !!probe.underlying

  async function register() {
    if (!wrapper || !detected || !probe.underlying) return
    setErrorMsg(null)
    setPhase('busy')
    setBusy(true)
    try {
      const { hash } = await run({ address: registry, abi: communityRegistryAbi, functionName: 'register', args: [probe.underlying, wrapper], chainId })
      setTxHash(hash)
      setPhase('done')
      onChanged()
      toast.push({ kind: 'success', title: `Registered ${probe.symbol ?? 'pair'}`, description: 'Added to the community registry — visible to everyone.', txHash: hash })
    } catch (e) {
      setPhase('error')
      setBusy(false)
      setErrorMsg(parseTxError(e))
      toast.push({ kind: 'error', title: 'Register failed', description: parseTxError(e) })
    }
  }

  if (phase === 'done') {
    return (
      <DoneStep
        title={`Registered ${probe.symbol ?? 'pair'}`}
        sub="The pair is now in the community registry — everyone sees it."
        txHash={txHash ?? undefined}
        txUrl={txHash ? explorerTx(txHash, chainId) : undefined}
        onDone={onClose}
      />
    )
  }
  if (phase === 'busy') {
    return <PendingStep stages={[{ key: 'register', title: 'Register pair', detail: 'Records the pair in the community registry on-chain', state: 'active' as const } as Stage]} foot="Confirm in your wallet" />
  }
  return (
    <>
      <p className="text-[13px] leading-[1.55] text-ink-muted">
        Paste an <b className="text-ink">already-deployed ERC-7984 wrapper</b>. We register it in our community registry (validated on-chain: <span className="font-mono text-[12px]">underlying()</span> must match) so it appears for <b className="text-ink">everyone</b>.
      </p>
      <FieldLabel>ERC-7984 WRAPPER ADDRESS</FieldLabel>
      <PasteField value={input} onChange={setInput} placeholder="0x…" />
      {detected && <DetectedBox title={<>Detected <b>{probe.symbol}</b> — valid ERC-7984.</>} sub={<>underlying ERC-20 · {probe.underlying ? shortAddress(probe.underlying, 6) : '—'}</>} />}
      {value && !valid && <AmountError>That doesn't look like a valid address.</AmountError>}
      {dup && <AmountError>This pair is already in the registry.</AmountError>}
      {probe.isLoading && <p className="mt-3 text-[12.5px] text-ink-muted">Reading token…</p>}
      {valid && !dup && probe.isErc7984 === false && <AmountError>Not a readable ERC-7984 wrapper (no underlying / confidential balance).</AmountError>}
      {phase === 'error' && errorMsg && <AmountError>{errorMsg}</AmountError>}
      <button onClick={register} disabled={!detected} className="btn-primary mt-4 w-full py-3.5 text-[14.5px]">
        {phase === 'error' ? 'Try again' : 'Register pair'}
      </button>
      <p className="mt-3 text-center text-[11px] text-ink-dim">A small on-chain transaction — free on Sepolia.</p>
    </>
  )
}

// ---------------------------------------------------------------------------
// Mode 3 — Save to browser (localStorage, private)
// ---------------------------------------------------------------------------

function TrackForm({ known, onClose }: { known: Set<string>; onClose: () => void }) {
  const chainId = useChainId()
  const toast = useToast()
  const { addPair } = useCustomPairs(chainId)
  const [input, setInput] = useState('')

  const value = input.trim()
  const valid = isAddress(value)
  const wrapper = valid ? (value as Address) : undefined
  const dup = valid && known.has(value.toLowerCase())
  const probe = useWrapperProbe(wrapper, chainId, valid && !dup)
  const detected = !!wrapper && !dup && probe.isErc7984 === true && !!probe.underlying

  function save() {
    if (!detected || !wrapper || !probe.underlying) return
    addPair({ erc20: probe.underlying, confidential: wrapper, label: probe.symbol })
    toast.push({ kind: 'success', title: `Added ${probe.symbol ?? 'pair'}`, description: 'Saved to your browser — it now shows in the registry.' })
    onClose()
  }

  return (
    <>
      <p className="text-[13px] leading-[1.55] text-ink-muted">
        Track any ERC-7984 wrapper <b className="text-ink">privately in this browser</b> (no gas, only you see it). Paste the wrapper address; we derive the ERC-20 from <span className="font-mono text-[12px]">underlying()</span>.
      </p>
      <FieldLabel>ERC-7984 WRAPPER ADDRESS</FieldLabel>
      <PasteField value={input} onChange={setInput} placeholder="0x…" />
      {detected && <DetectedBox title={<>Detected <b>{probe.symbol}</b> — valid ERC-7984.</>} sub={<>underlying ERC-20 · {probe.underlying ? shortAddress(probe.underlying, 6) : '—'}</>} />}
      {value && !valid && <AmountError>That doesn't look like a valid address.</AmountError>}
      {dup && <AmountError>This pair is already in your registry.</AmountError>}
      {probe.isLoading && <p className="mt-3 text-[12.5px] text-ink-muted">Reading token…</p>}
      {valid && !dup && probe.isErc7984 === false && <AmountError>Not a readable ERC-7984 wrapper (no underlying / confidential balance).</AmountError>}
      <button onClick={save} disabled={!detected} className="btn-primary mt-4 w-full py-3.5 text-[14.5px]">Save to browser</button>
    </>
  )
}

// ---------------------------------------------------------------------------
// Container — one "Add a pair" modal with a mode switcher
// ---------------------------------------------------------------------------

const SUBTITLE: Record<Mode, string> = {
  deploy: 'Deploy a wrapper for an ERC-20 and register it on-chain.',
  register: 'Register an existing ERC-7984 wrapper on-chain.',
  track: 'Track any ERC-7984 wrapper privately in this browser.',
}

export function AddPairModal({ open, onClose, known, knownErc20, onChanged }: AddPairModalProps) {
  const { config } = useActiveChain()
  const factory = config.factoryAddress
  const registry = config.customRegistryAddress
  const [busy, setBusy] = useState(false)

  const tabs = useMemo(
    () =>
      [
        factory ? { key: 'deploy' as const, label: 'Deploy new' } : null,
        registry ? { key: 'register' as const, label: 'Register existing' } : null,
        { key: 'track' as const, label: 'Save to browser' },
      ].filter(Boolean) as { key: Mode; label: string }[],
    [factory, registry],
  )
  const [mode, setMode] = useState<Mode>(tabs[0]?.key ?? 'track')

  function close() {
    // Always allow closing — including from the Done screen, where a finished
    // flow leaves `busy` true (it hides the tabs). Reset it on the way out.
    setBusy(false)
    onClose()
  }
  function switchMode(m: Mode) {
    if (busy) return
    setMode(m)
  }

  return (
    <Modal open={open} onClose={close} title="Add a pair" subtitle={SUBTITLE[mode]}>
      {!busy && tabs.length > 1 && (
        <div className="mb-4 flex gap-1 rounded-[11px] border border-line bg-paper-soft p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => switchMode(t.key)}
              className={`flex-1 rounded-[8px] px-2 py-2 text-[12.5px] font-bold transition-colors ${
                mode === t.key ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* key forces a fresh form (and state) per mode */}
      {mode === 'deploy' && factory && (
        <DeployForm key="deploy" knownErc20={knownErc20} factory={factory} onChanged={onChanged} onClose={close} setBusy={setBusy} />
      )}
      {mode === 'register' && registry && (
        <RegisterForm key="register" known={known} registry={registry} onChanged={onChanged} onClose={close} setBusy={setBusy} />
      )}
      {mode === 'track' && <TrackForm key="track" known={known} onClose={close} />}
    </Modal>
  )
}

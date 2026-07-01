import { useMemo, useState } from 'react'
import { useChainId, useReadContracts } from 'wagmi'
import { decodeEventLog, isAddress, type Address } from 'viem'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useTxRunner } from '@/hooks/useTxRunner'
import { useActiveChain } from '@/hooks/useActiveChain'
import { parseTxError } from '@/lib/errors'
import { explorerTx, shortAddress } from '@/lib/format'
import { erc20Abi } from '@/abi/erc20'
import { factoryAbi } from '@/abi/factory'
import { AmountError, PendingStep, DoneStep, type Stage } from './steps'

type Step = 'idle' | 'deploying' | 'done' | 'error'

interface DeployWrapperModalProps {
  open: boolean
  onClose: () => void
  /** Refetch the registry so the new community pair appears. */
  onDeployed: () => void
  /** Lowercased ERC-20 addresses that already have a pair (to warn). */
  knownErc20: Set<string>
}

/**
 * Deploy a brand-new ERC-7984 confidential wrapper for any ERC-20 via our
 * on-chain factory, which also registers the pair in the community registry —
 * so it shows up for everyone. Paste the ERC-20; we derive the name/symbol.
 */
export function DeployWrapperModal({ open, onClose, onDeployed, knownErc20 }: DeployWrapperModalProps) {
  const chainId = useChainId()
  const { config } = useActiveChain()
  const factory = config.factoryAddress
  const toast = useToast()
  const { run } = useTxRunner()

  const [input, setInput] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [deployed, setDeployed] = useState<string | null>(null)

  const value = input.trim()
  const valid = isAddress(value)
  const erc20 = valid ? (value as Address) : undefined
  const alreadyWrapped = valid && knownErc20.has(value.toLowerCase())
  const busy = step === 'deploying'

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

  const status = useMemo(() => {
    if (!value) return 'empty'
    if (!valid) return 'badAddress'
    if (isLoading) return 'loading'
    if (isErc20 === false) return 'notErc20'
    if (detected) return 'detected'
    return 'idle'
  }, [value, valid, isLoading, isErc20, detected])

  function reset() {
    setInput('')
    setStep('idle')
    setErrorMsg(null)
    setTxHash(null)
    setDeployed(null)
  }

  function close() {
    if (busy) return
    reset()
    onClose()
  }

  async function paste() {
    try {
      const t = await navigator.clipboard.readText()
      if (t) setInput(t.trim())
    } catch {
      /* clipboard unavailable */
    }
  }

  async function deploy() {
    if (!factory || !erc20 || !detected) return
    setErrorMsg(null)
    setStep('deploying')
    try {
      const { hash, receipt } = await run({
        address: factory,
        abi: factoryAbi,
        functionName: 'createWrapper',
        args: [erc20, cName, cSymbol, ''],
        chainId,
      })
      setTxHash(hash)

      // Pull the new wrapper address out of the WrapperCreated event.
      let wrapper: string | undefined
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({ abi: factoryAbi, data: log.data, topics: log.topics })
          if (ev.eventName === 'WrapperCreated') {
            wrapper = (ev.args as { confidentialToken: string }).confidentialToken
            break
          }
        } catch {
          /* not our event */
        }
      }
      setDeployed(wrapper ?? null)
      setStep('done')
      onDeployed() // refetch so the community registry read shows it
      toast.push({
        kind: 'success',
        title: `Deployed ${cSymbol}`,
        description: 'Wrapper deployed and registered — it now shows in the registry.',
        txHash: hash,
      })
    } catch (e) {
      setStep('error')
      setErrorMsg(parseTxError(e))
      toast.push({ kind: 'error', title: 'Deploy failed', description: parseTxError(e) })
    }
  }

  const stages: Stage[] = [
    {
      key: 'deploy',
      title: `Deploy ${cSymbol}`,
      detail: 'Deploys the wrapper and registers the pair on-chain',
      state: 'active',
    },
  ]

  return (
    <Modal
      open={open}
      onClose={close}
      title="Deploy a wrapper"
      subtitle="Create a confidential ERC-7984 wrapper for any ERC-20."
    >
      {step === 'done' ? (
        <DoneStep
          title={`Deployed ${cSymbol}`}
          sub={
            deployed
              ? `Wrapper live at ${shortAddress(deployed, 6)} and added to the community registry.`
              : 'Wrapper deployed and registered to the community registry.'
          }
          txHash={txHash ?? undefined}
          txUrl={txHash ? explorerTx(txHash, chainId) : undefined}
          onDone={close}
        />
      ) : busy ? (
        <PendingStep stages={stages} foot="Deploying an FHE contract takes a moment — confirm in your wallet" />
      ) : (
        <>
          <p className="text-[13.5px] leading-[1.55] text-ink-muted">
            Paste an <b className="text-ink">ERC-20</b> address. We deploy a confidential wrapper for
            it via the factory and register the pair on-chain — visible to everyone.
          </p>

          <div className="mt-[18px] font-mono text-[11px] tracking-[0.05em] text-ink-faint">
            ERC-20 TOKEN ADDRESS
          </div>
          <div className="mt-2 flex h-[46px] items-center gap-2.5 rounded-[11px] border border-line bg-paper-soft px-3.5 focus-within:border-ink">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              autoFocus
              className="w-full bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-ink-dim"
            />
            <button
              onClick={paste}
              className="shrink-0 rounded-md border border-line bg-paper-card px-2 py-1 font-mono text-[10px] font-bold hover:border-ink"
            >
              PASTE
            </button>
          </div>

          {status === 'detected' && (
            <div className="mt-3 rounded-[10px] border border-state-success/25 bg-state-success/[0.07] px-3 py-2.5 text-[12px] text-state-success">
              <div className="flex items-center gap-2 font-semibold">
                <span>✓</span> {symbol} · {decimals} decimals
              </div>
              <div className="mt-1 pl-6 font-mono text-[11px] text-ink-muted">
                will deploy <b className="text-ink-soft">{cSymbol}</b> — {cName}
              </div>
            </div>
          )}
          {status === 'loading' && <p className="mt-3 text-[12.5px] text-ink-muted">Reading token…</p>}
          {status === 'badAddress' && <AmountError>That doesn't look like a valid address.</AmountError>}
          {status === 'notErc20' && <AmountError>Not a readable ERC-20 (no symbol / decimals).</AmountError>}
          {step === 'error' && errorMsg && <AmountError>{errorMsg}</AmountError>}
          {detected && alreadyWrapped && (
            <p className="mt-2.5 text-center text-[11.5px] text-state-warn">
              This ERC-20 already has a wrapper in the registry — deploying makes another one.
            </p>
          )}

          <button onClick={deploy} disabled={!detected} className="btn-primary mt-4 w-full py-3.5 text-[14.5px]">
            {step === 'error' ? 'Try again' : `Deploy ${detected ? cSymbol : 'wrapper'}`}
          </button>
          <p className="mt-3 text-center text-[11px] text-ink-dim">
            Deploying a confidential contract costs gas — free on Sepolia, real on mainnet.
          </p>
        </>
      )}
    </Modal>
  )
}

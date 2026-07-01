import { useMemo, useState } from 'react'
import { useChainId, useReadContracts } from 'wagmi'
import { isAddress, zeroAddress, type Address } from 'viem'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useCustomPairs } from '@/hooks/useCustomPairs'
import { wrapperAbi } from '@/abi/wrapper'
import { shortAddress } from '@/lib/format'
import { AmountError } from './steps'

interface AddPairModalProps {
  open: boolean
  onClose: () => void
  /** Lowercased confidential addresses already in the grid (to flag duplicates). */
  known: Set<string>
}

/**
 * Add a custom ERC-20 ↔ ERC-7984 pair to the user's own (browser-saved)
 * registry. The user pastes only the ERC-7984 wrapper address; we read
 * `underlying()` to derive the ERC-20 and validate it's a real ERC-7984 token.
 */
export function AddPairModal({ open, onClose, known }: AddPairModalProps) {
  const chainId = useChainId()
  const toast = useToast()
  const { addPair } = useCustomPairs(chainId)
  const [input, setInput] = useState('')

  const value = input.trim()
  const valid = isAddress(value)
  const wrapper = valid ? (value as Address) : undefined
  const duplicate = valid && known.has(value.toLowerCase())

  const { data, isLoading } = useReadContracts({
    contracts: wrapper
      ? [
          { address: wrapper, abi: wrapperAbi, functionName: 'underlying', chainId },
          { address: wrapper, abi: wrapperAbi, functionName: 'symbol', chainId },
          {
            address: wrapper,
            abi: wrapperAbi,
            functionName: 'confidentialBalanceOf',
            args: [zeroAddress],
            chainId,
          },
        ]
      : [],
    query: { enabled: !!wrapper && !duplicate },
  })

  const underlying = data?.[0]?.result as Address | undefined
  const symbol = data?.[1]?.result as string | undefined
  const isErc7984 = data ? data[2]?.status === 'success' && data[0]?.status === 'success' : undefined
  const detected = !!wrapper && !duplicate && isErc7984 === true && !!underlying

  const status = useMemo(() => {
    if (!value) return 'empty'
    if (!valid) return 'badAddress'
    if (duplicate) return 'duplicate'
    if (isLoading) return 'loading'
    if (isErc7984 === false) return 'notWrapper'
    if (detected) return 'detected'
    return 'idle'
  }, [value, valid, duplicate, isLoading, isErc7984, detected])

  function reset() {
    setInput('')
  }

  function close() {
    reset()
    onClose()
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setInput(text.trim())
    } catch {
      /* clipboard unavailable */
    }
  }

  function save() {
    if (!detected || !wrapper || !underlying) return
    addPair({ erc20: underlying, confidential: wrapper, label: symbol })
    toast.push({
      kind: 'success',
      title: `Added ${symbol ?? 'pair'}`,
      description: 'Saved to your browser — it now shows in the registry.',
    })
    close()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a pair"
      subtitle="Track any ERC-7984 wrapper in your registry."
    >
      <p className="text-[13.5px] leading-[1.55] text-ink-muted">
        Paste an <b className="text-ink">ERC-7984 wrapper</b> address. We read its{' '}
        <span className="rounded bg-paper-soft px-1.5 py-0.5 font-mono text-[12px]">underlying()</span>{' '}
        token and add the pair to your registry. Saved in your browser — not on-chain.
      </p>

      <div className="mt-[18px] font-mono text-[11px] tracking-[0.05em] text-ink-faint">
        ERC-7984 TOKEN ADDRESS
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
            <span>✓</span> Detected <b>{symbol}</b> — valid ERC-7984 token.
          </div>
          <div className="mt-1 pl-6 font-mono text-[11px] text-ink-muted">
            underlying ERC-20 · {underlying ? shortAddress(underlying, 6) : '—'}
          </div>
        </div>
      )}
      {status === 'loading' && (
        <p className="mt-3 text-[12.5px] text-ink-muted">Reading token…</p>
      )}
      {status === 'badAddress' && <AmountError>That doesn't look like a valid address.</AmountError>}
      {status === 'duplicate' && <AmountError>This pair is already in your registry.</AmountError>}
      {status === 'notWrapper' && (
        <AmountError>Not a readable ERC-7984 wrapper (no underlying / confidential balance).</AmountError>
      )}

      <button onClick={save} disabled={!detected} className="btn-primary mt-4 w-full py-3.5 text-[14.5px]">
        Add pair
      </button>
    </Modal>
  )
}

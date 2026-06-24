import { useMemo, useState } from 'react'
import { useAccount, useReadContracts } from 'wagmi'
import { isAddress, type Address, type Hex } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { wrapperAbi } from '@/abi/wrapper'
import { ConfidentialBalance } from '@/components/ConfidentialBalance'
import { TokenGlyph } from '@/components/ui/TokenGlyph'
import { fallbackSymbol } from '@/lib/format'

const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000'

export function DecryptPanel() {
  const { address, isConnected } = useAccount()
  const [input, setInput] = useState('')

  const token = input.trim()
  const valid = isAddress(token)
  const tokenAddress = valid ? (token as Address) : undefined

  const { data, isLoading, isError } = useReadContracts({
    contracts: tokenAddress
      ? [
          { address: tokenAddress, abi: wrapperAbi, functionName: 'symbol' },
          { address: tokenAddress, abi: wrapperAbi, functionName: 'decimals' },
          {
            address: tokenAddress,
            abi: wrapperAbi,
            functionName: 'confidentialBalanceOf',
            args: address ? [address] : undefined,
          },
        ]
      : [],
    query: { enabled: !!tokenAddress && isConnected },
  })

  const symbol = (data?.[0]?.result as string | undefined) ?? (tokenAddress ? fallbackSymbol(tokenAddress) : '')
  const decimals = (data?.[1]?.result as number | undefined) ?? 6
  const handle = (data?.[2]?.result as Hex | undefined) ?? (ZERO_HANDLE as Hex)
  const isErc7984 = data ? data[2]?.status === 'success' : undefined
  const hasBalance = handle !== ZERO_HANDLE

  const status = useMemo(() => {
    if (!valid && token.length > 0) return 'badAddress'
    if (!tokenAddress) return 'empty'
    if (!isConnected) return 'connect'
    if (isLoading) return 'loading'
    if (isError || isErc7984 === false) return 'notToken'
    return 'ready'
  }, [valid, token, tokenAddress, isConnected, isLoading, isError, isErc7984])

  return (
    <section id="decrypt" className="mx-auto max-w-3xl px-5 py-14">
      <div className="surface-cipher overflow-hidden p-6 sm:p-8">
        <div className="mb-1.5 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffd208">
            <path d="M17 10V7a5 5 0 0 0-10 0v3H5v12h14V10h-2zM9 7a3 3 0 0 1 6 0v3H9V7z" />
          </svg>
          <h2 className="font-display text-xl font-bold tracking-tight text-white">
            Decrypt any balance
          </h2>
        </div>
        <p className="mb-5 max-w-lg text-sm leading-relaxed text-white/60">
          Paste any ERC-7984 token address to reveal your own confidential balance — works for
          tokens beyond this registry. Decryption is authorized by an EIP-712 signature; only you
          can read your balance.
        </p>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x… ERC-7984 token address"
          spellCheck={false}
          className="w-full rounded-[12px] border border-white/15 bg-white/5 px-4 py-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-zama-yellow/60"
        />

        <div className="mt-4">
          {status === 'badAddress' && (
            <p className="text-sm text-state-warn">That doesn't look like a valid address.</p>
          )}
          {status === 'empty' && (
            <p className="text-sm text-white/40">Enter a token address to begin.</p>
          )}
          {status === 'connect' && (
            <div className="flex items-center justify-between gap-3 rounded-card bg-white/5 p-3">
              <span className="text-sm text-white/60">Connect your wallet to decrypt your balance.</span>
              <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
            </div>
          )}
          {status === 'loading' && <p className="text-sm text-white/50">Reading token…</p>}
          {status === 'notToken' && (
            <p className="text-sm text-state-warn">
              This address isn't a readable ERC-7984 token (no confidential balance).
            </p>
          )}
          {status === 'ready' && tokenAddress && (
            <div className="flex items-center justify-between gap-4 rounded-card bg-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <TokenGlyph symbol={symbol} address={tokenAddress} confidential />
                <div>
                  <div className="font-display text-sm font-bold text-white">{symbol}</div>
                  <div className="text-xs text-white/40">{decimals} decimals</div>
                </div>
              </div>
              <div className="text-right">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  Your balance
                </div>
                <div className="text-white">
                  <ConfidentialBalance
                    contract={tokenAddress}
                    handle={handle}
                    decimals={decimals}
                    symbol={symbol}
                    hasBalance={hasBalance}
                    size="lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

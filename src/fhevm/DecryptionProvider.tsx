import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useAccount, useSignTypedData } from 'wagmi'
import type { Hex } from 'viem'
import { useFhevm } from './FhevmProvider'

/** Decryption authorization window. */
const DURATION_DAYS = 7

interface DecryptionContextValue {
  /** Decrypt one ERC-7984 balance handle for the connected wallet (EIP-712). */
  decrypt: (contractAddress: string, handle: Hex) => Promise<bigint>
  /** Cached cleartext for a (contract, handle), or undefined if not revealed. */
  getValue: (contractAddress: string, handle: Hex) => bigint | undefined
  isPending: (contractAddress: string, handle: Hex) => boolean
}

const DecryptionContext = createContext<DecryptionContextValue | undefined>(undefined)

const keyFor = (contract: string, handle: string) =>
  `${contract.toLowerCase()}:${handle.toLowerCase()}`

export function DecryptionProvider({ children }: { children: ReactNode }) {
  const { instance } = useFhevm()
  const { address } = useAccount()
  const { signTypedDataAsync } = useSignTypedData()

  const [cache, setCache] = useState<Record<string, bigint>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})

  const decrypt = useCallback(
    async (contractAddress: string, handle: Hex): Promise<bigint> => {
      if (!instance) throw new Error('The encryption engine is still loading. Try again shortly.')
      if (!address) throw new Error('Connect your wallet first.')

      const key = keyFor(contractAddress, handle)
      const cached = cache[key]
      if (cached !== undefined) return cached

      setPending((p) => ({ ...p, [key]: true }))
      try {
        // Ephemeral keypair the relayer encrypts the result to.
        const keypair = instance.generateKeypair()
        const startTimestamp = Math.floor(Date.now() / 1000)

        // EIP-712 authorization the user signs with their wallet.
        const eip712 = instance.createEIP712(
          keypair.publicKey,
          [contractAddress],
          startTimestamp,
          DURATION_DAYS,
        )

        const signature = await signTypedDataAsync({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          domain: eip712.domain as any,
          types: { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          primaryType: 'UserDecryptRequestVerification',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message: eip712.message as any,
        })

        const result = await instance.userDecrypt(
          [{ handle, contractAddress }],
          keypair.privateKey,
          keypair.publicKey,
          signature.replace(/^0x/, ''),
          [contractAddress],
          address,
          startTimestamp,
          DURATION_DAYS,
        )

        const raw = result[handle] ?? result[handle.toLowerCase() as Hex]
        const value = typeof raw === 'bigint' ? raw : BigInt((raw as number | string) ?? 0)

        setCache((c) => ({ ...c, [key]: value }))
        return value
      } finally {
        setPending((p) => {
          const next = { ...p }
          delete next[key]
          return next
        })
      }
    },
    [instance, address, signTypedDataAsync, cache],
  )

  const getValue = useCallback(
    (contractAddress: string, handle: Hex) => cache[keyFor(contractAddress, handle)],
    [cache],
  )
  const isPending = useCallback(
    (contractAddress: string, handle: Hex) => !!pending[keyFor(contractAddress, handle)],
    [pending],
  )

  return (
    <DecryptionContext.Provider value={{ decrypt, getValue, isPending }}>
      {children}
    </DecryptionContext.Provider>
  )
}

export function useDecryption(): DecryptionContextValue {
  const ctx = useContext(DecryptionContext)
  if (!ctx) throw new Error('useDecryption must be used within <DecryptionProvider>')
  return ctx
}

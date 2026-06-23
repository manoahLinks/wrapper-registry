import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
} from 'viem'

/** Map known custom-error names from our contracts to human messages. */
function friendlyRevert(name: string): string | null {
  switch (name) {
    case 'MintAmountExceedsMax':
      return 'That exceeds the faucet limit (1,000,000 tokens per claim).'
    case 'BlockedUser':
    case 'UnderlyingDenyListedAddress':
      return 'This wrapper has blocked your address from this action.'
    case 'ERC20InsufficientBalance':
      return 'Insufficient token balance for this transaction.'
    case 'ERC20InsufficientAllowance':
      return 'Token approval is too low — approve first, then try again.'
    case 'ERC7984ZeroBalance':
      return 'You have no confidential balance to use here.'
    case 'ERC7984UnauthorizedUseOfEncryptedAmount':
    case 'SenderNotAllowedToUseHandle':
      return 'Not authorized to use this encrypted amount. Re-encrypt and try again.'
    case 'InvalidKMSSignatures':
      return 'The decryption proof was rejected. Please retry the unwrap.'
    default:
      return null
  }
}

/** Turn a viem/wagmi error into a concise, user-facing message. */
export function parseTxError(e: unknown): string {
  if (e instanceof BaseError) {
    const rejected = e.walk((err) => err instanceof UserRejectedRequestError)
    if (rejected) return 'Request rejected in your wallet.'

    const reverted = e.walk((err) => err instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName ?? reverted.reason ?? ''
      const friendly = name ? friendlyRevert(name) : null
      return friendly ?? reverted.shortMessage ?? 'The transaction reverted.'
    }

    return e.shortMessage || e.message
  }
  if (e instanceof Error) return e.message
  return 'Something went wrong.'
}

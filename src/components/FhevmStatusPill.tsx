import { useFhevm } from '@/fhevm/FhevmProvider'

/**
 * Compact indicator of the encryption engine's readiness. Doubles as a
 * retry affordance if relayer initialization failed.
 */
export function FhevmStatusPill() {
  const { status, retry } = useFhevm()

  if (status === 'error') {
    return (
      <button
        onClick={retry}
        className="pill border-state-danger/40 text-state-danger hover:bg-state-danger/5"
        title="The FHEVM relayer failed to initialize. Click to retry."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-state-danger" />
        Encryption offline · retry
      </button>
    )
  }

  const loading = status === 'loading'
  return (
    <span
      className="pill"
      title={loading ? 'Loading the FHE encryption engine…' : 'FHE encryption engine ready'}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          loading ? 'animate-pulse-soft bg-zama-orange' : 'bg-state-success'
        }`}
      />
      {loading ? 'Encryption…' : 'Encryption ready'}
    </span>
  )
}

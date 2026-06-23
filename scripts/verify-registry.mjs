// Dev utility: reads the on-chain Wrappers Registry and every pair's token
// metadata via multicall — the same calls the app's useRegistryPairs hook makes.
// Run: node scripts/verify-registry.mjs
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

const REGISTRY = '0x2f0750Bbb0A246059d80e94c454586a7F27a128e'
const RPC = process.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'

const registryAbi = [
  {
    inputs: [],
    name: 'getTokenConfidentialTokenPairs',
    outputs: [
      {
        components: [
          { name: 'tokenAddress', type: 'address' },
          { name: 'confidentialTokenAddress', type: 'address' },
          { name: 'isValid', type: 'bool' },
        ],
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const metaAbi = [
  { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'rate', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
]

const client = createPublicClient({ chain: sepolia, transport: http(RPC) })

const pairs = await client.readContract({
  address: REGISTRY,
  abi: registryAbi,
  functionName: 'getTokenConfidentialTokenPairs',
})

console.log(`\nRegistry has ${pairs.length} pairs\n`)

const calls = pairs.flatMap((p) => [
  { address: p.tokenAddress, abi: metaAbi, functionName: 'symbol' },
  { address: p.tokenAddress, abi: metaAbi, functionName: 'decimals' },
  { address: p.confidentialTokenAddress, abi: metaAbi, functionName: 'symbol' },
  { address: p.confidentialTokenAddress, abi: metaAbi, functionName: 'decimals' },
  { address: p.confidentialTokenAddress, abi: metaAbi, functionName: 'rate' },
])
const res = await client.multicall({ contracts: calls, allowFailure: true })

let ok = 0
pairs.forEach((p, i) => {
  const b = i * 5
  const g = (o) => (res[b + o].status === 'success' ? res[b + o].result : '⚠️FAIL')
  const erc20Sym = g(0)
  const erc20Dec = g(1)
  const cSym = g(2)
  const cDec = g(3)
  const rate = g(4)
  const good = ![erc20Sym, erc20Dec, cSym, cDec].includes('⚠️FAIL')
  if (good) ok++
  console.log(
    `${i + 1}. ${String(erc20Sym).padEnd(7)} (${erc20Dec}d) → ${String(cSym).padEnd(8)} (${cDec}d)  rate=${rate}  valid=${p.isValid}  ${good ? '✓' : '✗ metadata gap'}`,
  )
})
console.log(`\n${ok}/${pairs.length} pairs resolved full metadata.\n`)

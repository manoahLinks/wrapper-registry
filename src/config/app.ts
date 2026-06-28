import { chainConfigOrDefault, explorerUrl } from './chain'

export const APP_NAME = 'Confidential Wrapper Registry'

// Public GitHub repository (open-source requirement).
export const REPO_URL = 'https://github.com/manoahLinks/wrapper-registry'

// Reference docs for the official registry contract.
export const ZAMA_DOCS_URL = 'https://docs.zama.org/protocol/protocol-apps/registry-contract'

/** Explorer link to the registry contract on the given (or default) chain. */
export function registryExplorerUrl(chainId?: number): string {
  return `${explorerUrl(chainId)}/address/${chainConfigOrDefault(chainId).registryAddress}`
}

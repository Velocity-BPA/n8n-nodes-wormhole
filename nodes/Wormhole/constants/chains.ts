/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Wormhole Chain IDs
 * Note: These are Wormhole-specific chain IDs, not standard EVM chain IDs
 */
export const WORMHOLE_CHAINS: Record<string, number> = {
  solana: 1,
  ethereum: 2,
  terra: 3,
  bsc: 4,
  polygon: 5,
  avalanche: 6,
  oasis: 7,
  algorand: 8,
  aurora: 9,
  fantom: 10,
  karura: 11,
  acala: 12,
  klaytn: 13,
  celo: 14,
  near: 15,
  moonbeam: 16,
  neon: 17,
  terra2: 18,
  injective: 19,
  osmosis: 20,
  sui: 21,
  aptos: 22,
  arbitrum: 23,
  optimism: 24,
  gnosis: 25,
  pythnet: 26,
  xpla: 28,
  btc: 29,
  base: 30,
  sei: 32,
  rootstock: 33,
  scroll: 34,
  mantle: 35,
  blast: 36,
  xlayer: 37,
  linea: 38,
  berachain: 39,
  seievm: 40,
  snaxchain: 43,
  wormchain: 3104,
  cosmoshub: 4000,
  evmos: 4001,
  kujira: 4002,
  neutron: 4003,
  celestia: 4004,
  stargaze: 4005,
  seda: 4006,
  dymension: 4007,
  provenance: 4008,
  sepolia: 10002,
  arbitrumsepolia: 10003,
  basesepolia: 10004,
  optimismsepolia: 10005,
  holesky: 10006,
  polygonsepolia: 10007,
};

/**
 * Reverse mapping from chain ID to chain name
 */
export const CHAIN_ID_TO_NAME: Record<number, string> = Object.entries(WORMHOLE_CHAINS).reduce(
  (acc, [name, id]) => {
    acc[id] = name;
    return acc;
  },
  {} as Record<number, string>,
);

/**
 * Chain display names for UI
 */
export const CHAIN_DISPLAY_NAMES: Record<string, string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  terra: 'Terra Classic',
  bsc: 'BNB Smart Chain',
  polygon: 'Polygon',
  avalanche: 'Avalanche',
  oasis: 'Oasis',
  algorand: 'Algorand',
  aurora: 'Aurora',
  fantom: 'Fantom',
  karura: 'Karura',
  acala: 'Acala',
  klaytn: 'Klaytn',
  celo: 'Celo',
  near: 'NEAR',
  moonbeam: 'Moonbeam',
  neon: 'Neon',
  terra2: 'Terra',
  injective: 'Injective',
  osmosis: 'Osmosis',
  sui: 'Sui',
  aptos: 'Aptos',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
  gnosis: 'Gnosis',
  pythnet: 'Pythnet',
  xpla: 'XPLA',
  btc: 'Bitcoin',
  base: 'Base',
  sei: 'Sei',
  rootstock: 'Rootstock',
  scroll: 'Scroll',
  mantle: 'Mantle',
  blast: 'Blast',
  xlayer: 'X Layer',
  linea: 'Linea',
  berachain: 'Berachain',
  seievm: 'Sei EVM',
  snaxchain: 'Snax Chain',
  wormchain: 'Wormchain',
  cosmoshub: 'Cosmos Hub',
  evmos: 'Evmos',
  kujira: 'Kujira',
  neutron: 'Neutron',
  celestia: 'Celestia',
  stargaze: 'Stargaze',
  seda: 'Seda',
  dymension: 'Dymension',
  provenance: 'Provenance',
  sepolia: 'Sepolia (Testnet)',
  arbitrumsepolia: 'Arbitrum Sepolia (Testnet)',
  basesepolia: 'Base Sepolia (Testnet)',
  optimismsepolia: 'Optimism Sepolia (Testnet)',
  holesky: 'Holesky (Testnet)',
  polygonsepolia: 'Polygon Sepolia (Testnet)',
};

/**
 * EVM-compatible chains
 */
export const EVM_CHAINS = new Set([
  'ethereum',
  'bsc',
  'polygon',
  'avalanche',
  'aurora',
  'fantom',
  'karura',
  'acala',
  'klaytn',
  'celo',
  'moonbeam',
  'neon',
  'arbitrum',
  'optimism',
  'gnosis',
  'base',
  'rootstock',
  'scroll',
  'mantle',
  'blast',
  'xlayer',
  'linea',
  'berachain',
  'seievm',
  'sepolia',
  'arbitrumsepolia',
  'basesepolia',
  'optimismsepolia',
  'holesky',
  'polygonsepolia',
]);

/**
 * Non-EVM chains
 */
export const NON_EVM_CHAINS = new Set([
  'solana',
  'terra',
  'algorand',
  'near',
  'terra2',
  'injective',
  'osmosis',
  'sui',
  'aptos',
  'pythnet',
  'xpla',
  'btc',
  'sei',
  'wormchain',
  'cosmoshub',
  'evmos',
  'kujira',
  'neutron',
  'celestia',
  'stargaze',
  'seda',
  'dymension',
  'provenance',
]);

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  mainnet: {
    wormholescan: 'https://api.wormholescan.io',
    guardian: 'https://wormhole-v2-mainnet-api.certus.one',
  },
  testnet: {
    wormholescan: 'https://api.testnet.wormholescan.io',
    guardian: 'https://wormhole-v2-testnet-api.certus.one',
  },
};

/**
 * VAA status values
 */
export const VAA_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
} as const;

/**
 * Transfer status values
 */
export const TRANSFER_STATUS = {
  PENDING: 'pending',
  ATTESTED: 'attested',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

/**
 * Default pagination limits
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/**
 * Polling intervals for triggers (in milliseconds)
 */
export const POLL_INTERVALS = {
  FAST: 10000,     // 10 seconds
  NORMAL: 30000,   // 30 seconds
  SLOW: 60000,     // 1 minute
} as const;

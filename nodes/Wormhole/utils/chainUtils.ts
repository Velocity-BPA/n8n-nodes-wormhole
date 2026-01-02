/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  WORMHOLE_CHAINS,
  CHAIN_ID_TO_NAME,
  CHAIN_DISPLAY_NAMES,
  EVM_CHAINS,
  NON_EVM_CHAINS,
} from '../constants/chains';

/**
 * Get Wormhole chain ID from chain name
 */
export function getChainId(chainName: string): number | undefined {
  const normalizedName = chainName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return WORMHOLE_CHAINS[normalizedName];
}

/**
 * Get chain name from Wormhole chain ID
 */
export function getChainName(chainId: number): string | undefined {
  return CHAIN_ID_TO_NAME[chainId];
}

/**
 * Get display name for a chain
 */
export function getChainDisplayName(chainIdOrName: number | string): string {
  let name: string | undefined;
  
  if (typeof chainIdOrName === 'number') {
    name = CHAIN_ID_TO_NAME[chainIdOrName];
  } else {
    name = chainIdOrName.toLowerCase();
  }
  
  if (name && CHAIN_DISPLAY_NAMES[name]) {
    return CHAIN_DISPLAY_NAMES[name];
  }
  
  // Capitalize first letter as fallback
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : `Chain ${chainIdOrName}`;
}

/**
 * Check if a chain is EVM-compatible
 */
export function isEvmChain(chainIdOrName: number | string): boolean {
  let name: string | undefined;
  
  if (typeof chainIdOrName === 'number') {
    name = CHAIN_ID_TO_NAME[chainIdOrName];
  } else {
    name = chainIdOrName.toLowerCase();
  }
  
  return name ? EVM_CHAINS.has(name) : false;
}

/**
 * Check if a chain is non-EVM
 */
export function isNonEvmChain(chainIdOrName: number | string): boolean {
  let name: string | undefined;
  
  if (typeof chainIdOrName === 'number') {
    name = CHAIN_ID_TO_NAME[chainIdOrName];
  } else {
    name = chainIdOrName.toLowerCase();
  }
  
  return name ? NON_EVM_CHAINS.has(name) : false;
}

/**
 * Get all supported chain IDs
 */
export function getAllChainIds(): number[] {
  return Object.values(WORMHOLE_CHAINS);
}

/**
 * Get all supported chain names
 */
export function getAllChainNames(): string[] {
  return Object.keys(WORMHOLE_CHAINS);
}

/**
 * Get all EVM chain IDs
 */
export function getEvmChainIds(): number[] {
  return Array.from(EVM_CHAINS)
    .map((name) => WORMHOLE_CHAINS[name])
    .filter((id): id is number => id !== undefined);
}

/**
 * Get all non-EVM chain IDs
 */
export function getNonEvmChainIds(): number[] {
  return Array.from(NON_EVM_CHAINS)
    .map((name) => WORMHOLE_CHAINS[name])
    .filter((id): id is number => id !== undefined);
}

/**
 * Check if a chain ID is valid
 */
export function isValidChainId(chainId: number): boolean {
  return CHAIN_ID_TO_NAME[chainId] !== undefined;
}

/**
 * Check if a chain name is valid
 */
export function isValidChainName(chainName: string): boolean {
  const normalizedName = chainName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return WORMHOLE_CHAINS[normalizedName] !== undefined;
}

/**
 * Get chain options for n8n dropdown
 */
export function getChainOptions(): Array<{ name: string; value: number }> {
  return Object.entries(WORMHOLE_CHAINS)
    .map(([name, id]) => ({
      name: CHAIN_DISPLAY_NAMES[name] || name,
      value: id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get mainnet chain options (exclude testnets)
 */
export function getMainnetChainOptions(): Array<{ name: string; value: number }> {
  const testnetIds = [10002, 10003, 10004, 10005, 10006, 10007];
  return getChainOptions().filter((option) => !testnetIds.includes(option.value));
}

/**
 * Get testnet chain options
 */
export function getTestnetChainOptions(): Array<{ name: string; value: number }> {
  const testnetIds = [10002, 10003, 10004, 10005, 10006, 10007];
  return getChainOptions().filter((option) => testnetIds.includes(option.value));
}

/**
 * Get explorer URL for a chain
 */
export function getExplorerUrl(chainId: number, txHash?: string): string | undefined {
  const explorers: Record<number, string> = {
    1: 'https://solscan.io',
    2: 'https://etherscan.io',
    4: 'https://bscscan.com',
    5: 'https://polygonscan.com',
    6: 'https://snowtrace.io',
    10: 'https://ftmscan.com',
    14: 'https://celoscan.io',
    16: 'https://moonscan.io',
    21: 'https://suiscan.xyz',
    22: 'https://explorer.aptoslabs.com',
    23: 'https://arbiscan.io',
    24: 'https://optimistic.etherscan.io',
    30: 'https://basescan.org',
    34: 'https://scrollscan.com',
    35: 'https://mantlescan.xyz',
    36: 'https://blastscan.io',
    38: 'https://lineascan.build',
  };
  
  const baseUrl = explorers[chainId];
  if (!baseUrl) {
    return undefined;
  }
  
  if (txHash) {
    return `${baseUrl}/tx/${txHash}`;
  }
  
  return baseUrl;
}

/**
 * Get estimated finality time for a chain (in seconds)
 */
export function getChainFinality(chainId: number): number {
  const finalities: Record<number, number> = {
    1: 32,     // Solana - ~32 slots
    2: 900,    // Ethereum - ~15 minutes (64 blocks)
    4: 45,     // BSC - 15 blocks
    5: 256,    // Polygon - 256 blocks
    6: 2,      // Avalanche - instant finality
    10: 2,     // Fantom - instant finality
    21: 3,     // Sui - ~3 seconds
    22: 2,     // Aptos - ~2 seconds
    23: 900,   // Arbitrum - depends on L1
    24: 900,   // Optimism - depends on L1
    30: 900,   // Base - depends on L1
  };
  
  return finalities[chainId] || 60; // Default 1 minute
}

/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { EVM_CHAINS, WORMHOLE_CHAINS, CHAIN_ID_TO_NAME } from '../constants/chains';

/**
 * Encode an address for a specific Wormhole chain
 * Wormhole uses 32-byte (64 hex chars) addresses padded with zeros
 */
export function encodeAddress(address: string, chainId: number): string {
  const chainName = CHAIN_ID_TO_NAME[chainId];
  
  // Remove any prefix
  let cleanAddress = address.toLowerCase();
  if (cleanAddress.startsWith('0x')) {
    cleanAddress = cleanAddress.slice(2);
  }
  
  // For EVM chains, pad to 32 bytes (64 hex chars)
  if (chainName && EVM_CHAINS.has(chainName)) {
    // EVM addresses are 20 bytes, need to left-pad to 32 bytes
    return cleanAddress.padStart(64, '0');
  }
  
  // For Solana and other chains, addresses may already be 32 bytes
  if (chainId === WORMHOLE_CHAINS.solana) {
    // Solana addresses are base58, convert to hex if needed
    if (cleanAddress.length === 64) {
      return cleanAddress;
    }
    // Base58 decode would be needed here for proper implementation
    return cleanAddress.padStart(64, '0');
  }
  
  // Default: ensure 32-byte format
  return cleanAddress.padStart(64, '0');
}

/**
 * Decode a Wormhole-formatted address to native format
 */
export function decodeAddress(encodedAddress: string, chainId: number): string {
  const chainName = CHAIN_ID_TO_NAME[chainId];
  
  // Remove any prefix and clean
  let cleanAddress = encodedAddress.toLowerCase();
  if (cleanAddress.startsWith('0x')) {
    cleanAddress = cleanAddress.slice(2);
  }
  
  // For EVM chains, extract the last 40 chars (20 bytes)
  if (chainName && EVM_CHAINS.has(chainName)) {
    const evmAddress = cleanAddress.slice(-40);
    return '0x' + evmAddress;
  }
  
  // For Solana, return as hex (would need base58 encoding for native format)
  if (chainId === WORMHOLE_CHAINS.solana) {
    return cleanAddress;
  }
  
  // Default: return as-is
  return cleanAddress;
}

/**
 * Validate an address for a specific chain
 */
export function validateAddress(address: string, chainId: number): boolean {
  const chainName = CHAIN_ID_TO_NAME[chainId];
  
  if (!address) {
    return false;
  }
  
  // Clean the address
  let cleanAddress = address.toLowerCase();
  if (cleanAddress.startsWith('0x')) {
    cleanAddress = cleanAddress.slice(2);
  }
  
  // Check if it's valid hex
  if (!/^[0-9a-f]+$/i.test(cleanAddress)) {
    // Might be base58 for Solana
    if (chainId === WORMHOLE_CHAINS.solana) {
      return /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
    }
    return false;
  }
  
  // EVM addresses should be 40 hex chars
  if (chainName && EVM_CHAINS.has(chainName)) {
    return cleanAddress.length === 40 || cleanAddress.length === 64;
  }
  
  // Wormhole addresses are typically 64 hex chars
  return cleanAddress.length <= 64;
}

/**
 * Format an address for display
 */
export function formatAddressForDisplay(address: string, chainId: number): string {
  const decoded = decodeAddress(address, chainId);
  
  // Truncate for display: first 6 + last 4 chars
  if (decoded.length > 14) {
    const prefix = decoded.startsWith('0x') ? decoded.slice(0, 8) : decoded.slice(0, 6);
    const suffix = decoded.slice(-4);
    return `${prefix}...${suffix}`;
  }
  
  return decoded;
}

/**
 * Parse a VAA ID into its components
 * VAA ID format: emitterChain/emitterAddress/sequence
 */
export function parseVaaId(vaaId: string): {
  emitterChain: number;
  emitterAddress: string;
  sequence: string;
} | null {
  const parts = vaaId.split('/');
  
  if (parts.length !== 3) {
    return null;
  }
  
  const emitterChain = parseInt(parts[0], 10);
  const emitterAddress = parts[1];
  const sequence = parts[2];
  
  if (isNaN(emitterChain)) {
    return null;
  }
  
  return {
    emitterChain,
    emitterAddress,
    sequence,
  };
}

/**
 * Build a VAA ID from components
 */
export function buildVaaId(
  emitterChain: number,
  emitterAddress: string,
  sequence: string | number
): string {
  const encodedAddress = encodeAddress(emitterAddress, emitterChain);
  return `${emitterChain}/${encodedAddress}/${sequence}`;
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  let cleanHex = hex;
  if (cleanHex.startsWith('0x')) {
    cleanHex = cleanHex.slice(2);
  }
  
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

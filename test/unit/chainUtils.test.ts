/**
 * n8n-nodes-wormhole
 * Copyright (c) 2025 Velocity BPA
 *
 * Licensed under the Business Source License 1.1 (BSL-1.1).
 * Commercial use by for-profit organizations requires a commercial license.
 * See LICENSE file for details.
 */

import {
	getChainId,
	getChainName,
	getChainDisplayName,
	isEvmChain,
	isNonEvmChain,
	isValidChainId,
	isValidChainName,
	getChainOptions,
	getExplorerUrl,
	getChainFinality,
} from '../../nodes/Wormhole/utils/chainUtils';

describe('Chain Utilities', () => {
	describe('getChainId', () => {
		it('should return correct chain ID for known chains', () => {
			expect(getChainId('solana')).toBe(1);
			expect(getChainId('ethereum')).toBe(2);
			expect(getChainId('bsc')).toBe(4);
			expect(getChainId('polygon')).toBe(5);
		});

		it('should return undefined for unknown chains', () => {
			expect(getChainId('unknown')).toBeUndefined();
			expect(getChainId('')).toBeUndefined();
		});
	});

	describe('getChainName', () => {
		it('should return correct chain name for known IDs', () => {
			expect(getChainName(1)).toBe('solana');
			expect(getChainName(2)).toBe('ethereum');
			expect(getChainName(4)).toBe('bsc');
			expect(getChainName(5)).toBe('polygon');
		});

		it('should return undefined for unknown IDs', () => {
			expect(getChainName(999)).toBeUndefined();
			expect(getChainName(0)).toBeUndefined();
		});
	});

	describe('getChainDisplayName', () => {
		it('should return display names for known chains', () => {
			expect(getChainDisplayName(1)).toBe('Solana');
			expect(getChainDisplayName(2)).toBe('Ethereum');
			expect(getChainDisplayName(4)).toBe('BNB Smart Chain');
		});

		it('should return fallback name for unknown chains', () => {
			expect(getChainDisplayName(999)).toBe('Chain 999');
		});
	});

	describe('isEvmChain', () => {
		it('should return true for EVM chains', () => {
			expect(isEvmChain(2)).toBe(true); // Ethereum
			expect(isEvmChain(4)).toBe(true); // BSC
			expect(isEvmChain(5)).toBe(true); // Polygon
			expect(isEvmChain(6)).toBe(true); // Avalanche
		});

		it('should return false for non-EVM chains', () => {
			expect(isEvmChain(1)).toBe(false); // Solana
			expect(isEvmChain(21)).toBe(false); // Sui
			expect(isEvmChain(22)).toBe(false); // Aptos
		});
	});

	describe('isNonEvmChain', () => {
		it('should return true for non-EVM chains', () => {
			expect(isNonEvmChain(1)).toBe(true); // Solana
			expect(isNonEvmChain(21)).toBe(true); // Sui
			expect(isNonEvmChain(22)).toBe(true); // Aptos
		});

		it('should return false for EVM chains', () => {
			expect(isNonEvmChain(2)).toBe(false); // Ethereum
			expect(isNonEvmChain(4)).toBe(false); // BSC
		});
	});

	describe('isValidChainId', () => {
		it('should return true for valid chain IDs', () => {
			expect(isValidChainId(1)).toBe(true);
			expect(isValidChainId(2)).toBe(true);
			expect(isValidChainId(22)).toBe(true);
		});

		it('should return false for invalid chain IDs', () => {
			expect(isValidChainId(0)).toBe(false);
			expect(isValidChainId(999)).toBe(false);
			expect(isValidChainId(-1)).toBe(false);
		});
	});

	describe('isValidChainName', () => {
		it('should return true for valid chain names', () => {
			expect(isValidChainName('solana')).toBe(true);
			expect(isValidChainName('ethereum')).toBe(true);
			expect(isValidChainName('polygon')).toBe(true);
		});

		it('should return false for invalid chain names', () => {
			expect(isValidChainName('unknown')).toBe(false);
			expect(isValidChainName('')).toBe(false);
		});
	});

	describe('getChainOptions', () => {
		it('should return array of chain options', () => {
			const options = getChainOptions();
			expect(Array.isArray(options)).toBe(true);
			expect(options.length).toBeGreaterThan(0);
		});

		it('should have correct option format', () => {
			const options = getChainOptions();
			const ethOption = options.find(o => o.value === 2);
			expect(ethOption).toBeDefined();
			expect(ethOption?.name).toBe('Ethereum');
		});
	});

	describe('getExplorerUrl', () => {
		it('should return explorer URLs for EVM chains', () => {
			const ethUrl = getExplorerUrl(2, '0x123');
			expect(ethUrl).toContain('etherscan.io');
			expect(ethUrl).toContain('0x123');
		});

		it('should return explorer URL for Solana', () => {
			const solUrl = getExplorerUrl(1, 'abc123');
			expect(solUrl).toContain('solscan.io');
		});

		it('should return undefined for unknown chains', () => {
			expect(getExplorerUrl(999, 'test')).toBeUndefined();
		});
	});

	describe('getChainFinality', () => {
		it('should return finality times for known chains', () => {
			expect(getChainFinality(2)).toBeGreaterThan(0); // Ethereum
			expect(getChainFinality(1)).toBeGreaterThan(0); // Solana
		});

		it('should return default for unknown chains', () => {
			expect(getChainFinality(999)).toBe(60); // Default 60 seconds
		});
	});
});

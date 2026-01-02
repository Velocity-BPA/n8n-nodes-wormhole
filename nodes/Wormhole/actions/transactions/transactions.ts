/**
 * n8n-nodes-wormhole
 * Copyright (c) 2025 Velocity BPA
 *
 * Licensed under the Business Source License 1.1 (BSL-1.1).
 * Commercial use by for-profit organizations requires a commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { wormholeApiRequest, wormholeApiRequestAllItems } from '../../transport/wormholeClient';
import { getChainOptions } from '../../utils/chainUtils';
import { cleanObject, formatTimestamp } from '../../utils/helpers';

export const transactionsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['transactions'],
			},
		},
		options: [
			{
				name: 'Get Recent Transactions',
				value: 'getRecentTransactions',
				description: 'Get latest activity',
				action: 'Get recent transactions',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details',
				action: 'Get transaction details',
			},
			{
				name: 'Get Transaction Status',
				value: 'getTransactionStatus',
				description: 'Get transaction completion status',
				action: 'Get transaction status',
			},
			{
				name: 'Get Transactions by Address',
				value: 'getTransactionsByAddress',
				description: 'Get user history',
				action: 'Get transactions by address',
			},
			{
				name: 'Search Transactions',
				value: 'searchTransactions',
				description: 'Query transactions with filters',
				action: 'Search transactions',
			},
		],
		default: 'getTransaction',
	},
];

export const transactionsFields: INodeProperties[] = [
	// getTransaction fields
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		required: true,
		default: '',
		description: 'Transaction hash to look up',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['getTransaction', 'getTransactionStatus'],
			},
		},
	},
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: getChainOptions(),
		required: true,
		default: '',
		description: 'Chain where transaction occurred',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['getTransaction', 'getTransactionStatus'],
			},
		},
	},

	// searchTransactions fields
	{
		displayName: 'Source Chain',
		name: 'sourceChain',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Filter by source chain',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['searchTransactions'],
			},
		},
	},
	{
		displayName: 'Target Chain',
		name: 'targetChain',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Filter by target chain',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['searchTransactions'],
			},
		},
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		description: 'Filter by sender or receiver address',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['searchTransactions'],
			},
		},
	},
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		default: '',
		description: 'Filter by token contract address',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['searchTransactions'],
			},
		},
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		options: [
			{ name: 'All', value: '' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Completed', value: 'completed' },
			{ name: 'Failed', value: 'failed' },
		],
		default: '',
		description: 'Filter by transaction status',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['searchTransactions'],
			},
		},
	},
	{
		displayName: 'From Date',
		name: 'fromDate',
		type: 'dateTime',
		default: '',
		description: 'Start date for search range',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['searchTransactions'],
			},
		},
	},
	{
		displayName: 'To Date',
		name: 'toDate',
		type: 'dateTime',
		default: '',
		description: 'End date for search range',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['searchTransactions'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'Maximum number of transactions to return',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['searchTransactions', 'getRecentTransactions', 'getTransactionsByAddress'],
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to the limit',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['searchTransactions', 'getTransactionsByAddress'],
			},
		},
	},

	// getRecentTransactions fields
	{
		displayName: 'Chain Filter',
		name: 'chainFilter',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Filter by specific chain (leave empty for all chains)',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['getRecentTransactions'],
			},
		},
	},

	// getTransactionsByAddress fields
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		description: 'Wallet address to get transaction history for',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['getTransactionsByAddress'],
			},
		},
	},
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Filter by specific chain',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['getTransactionsByAddress'],
			},
		},
	},
	{
		displayName: 'Include Pending',
		name: 'includePending',
		type: 'boolean',
		default: true,
		description: 'Whether to include pending transactions',
		displayOptions: {
			show: {
				resource: ['transactions'],
				operation: ['getTransactionsByAddress'],
			},
		},
	},
];

export async function executeTransactions(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: unknown;

	try {
		switch (operation) {
			case 'getTransaction': {
				const txHash = this.getNodeParameter('txHash', index) as string;
				const chain = this.getNodeParameter('chain', index) as string;

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: `/api/v1/transactions/${chain}/${txHash}`,
				});

				// Format timestamps
				const tx = responseData as Record<string, unknown>;
				if (tx.timestamp) {
					tx.timestamp = formatTimestamp(String(tx.timestamp));
				}
				if (tx.completedAt) {
					tx.completedAt = formatTimestamp(String(tx.completedAt));
				}
				break;
			}

			case 'searchTransactions': {
				const sourceChain = this.getNodeParameter('sourceChain', index, '') as string;
				const targetChain = this.getNodeParameter('targetChain', index, '') as string;
				const address = this.getNodeParameter('address', index, '') as string;
				const tokenAddress = this.getNodeParameter('tokenAddress', index, '') as string;
				const status = this.getNodeParameter('status', index, '') as string;
				const fromDate = this.getNodeParameter('fromDate', index, '') as string;
				const toDate = this.getNodeParameter('toDate', index, '') as string;
				const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
				const limit = this.getNodeParameter('limit', index, 50) as number;

				const queryParams = cleanObject({
					sourceChain: sourceChain || undefined,
					targetChain: targetChain || undefined,
					address: address || undefined,
					tokenAddress: tokenAddress || undefined,
					status: status || undefined,
					fromDate: fromDate || undefined,
					toDate: toDate || undefined,
					pageSize: limit.toString(),
				});

				if (returnAll) {
					responseData = await wormholeApiRequestAllItems.call(this, {
						method: 'GET',
						endpoint: '/api/v1/transactions',
						query: queryParams,
					}, 'transactions');
				} else {
					const response = await wormholeApiRequest.call(this, {
						method: 'GET',
						endpoint: '/api/v1/transactions',
						query: queryParams,
					});
					responseData = (response as { transactions?: unknown[] }).transactions || response;
				}

				// Format timestamps
				if (Array.isArray(responseData)) {
					responseData = responseData.map((tx: Record<string, unknown>) => ({
						...tx,
						timestamp: tx.timestamp ? formatTimestamp(String(tx.timestamp)) : undefined,
						completedAt: tx.completedAt ? formatTimestamp(String(tx.completedAt)) : undefined,
					}));
				}
				break;
			}

			case 'getRecentTransactions': {
				const chainFilter = this.getNodeParameter('chainFilter', index, '') as string;
				const limit = this.getNodeParameter('limit', index, 50) as number;

				const queryParams = cleanObject({
					chain: chainFilter || undefined,
					pageSize: limit.toString(),
				});

				const response = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: '/api/v1/transactions',
					query: queryParams,
				});
				responseData = (response as { transactions?: unknown[] }).transactions || response;

				// Format timestamps
				if (Array.isArray(responseData)) {
					responseData = responseData.map((tx: Record<string, unknown>) => ({
						...tx,
						timestamp: tx.timestamp ? formatTimestamp(String(tx.timestamp)) : undefined,
						completedAt: tx.completedAt ? formatTimestamp(String(tx.completedAt)) : undefined,
					}));
				}
				break;
			}

			case 'getTransactionsByAddress': {
				const address = this.getNodeParameter('address', index) as string;
				const chain = this.getNodeParameter('chain', index, '') as string;
				const includePending = this.getNodeParameter('includePending', index, true) as boolean;
				const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
				const limit = this.getNodeParameter('limit', index, 50) as number;

				const queryParams = cleanObject({
					chain: chain || undefined,
					includePending: includePending ? 'true' : 'false',
					pageSize: limit.toString(),
				});

				if (returnAll) {
					responseData = await wormholeApiRequestAllItems.call(this, {
						method: 'GET',
						endpoint: `/api/v1/transactions/address/${address}`,
						query: queryParams,
					}, 'transactions');
				} else {
					const response = await wormholeApiRequest.call(this, {
						method: 'GET',
						endpoint: `/api/v1/transactions/address/${address}`,
						query: queryParams,
					});
					responseData = (response as { transactions?: unknown[] }).transactions || response;
				}

				// Format timestamps
				if (Array.isArray(responseData)) {
					responseData = responseData.map((tx: Record<string, unknown>) => ({
						...tx,
						timestamp: tx.timestamp ? formatTimestamp(String(tx.timestamp)) : undefined,
						completedAt: tx.completedAt ? formatTimestamp(String(tx.completedAt)) : undefined,
					}));
				}
				break;
			}

			case 'getTransactionStatus': {
				const txHash = this.getNodeParameter('txHash', index) as string;
				const chain = this.getNodeParameter('chain', index) as string;

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: `/api/v1/transactions/${chain}/${txHash}/status`,
				});

				// Format timestamps
				const status = responseData as Record<string, unknown>;
				if (status.lastUpdated) {
					status.lastUpdated = formatTimestamp(String(status.lastUpdated));
				}
				break;
			}

			default:
				throw new NodeOperationError(
					this.getNode(),
					`The operation "${operation}" is not supported`,
				);
		}

		return [{ json: responseData as IDataObject }];
	} catch (error) {
		if (this.continueOnFail()) {
			return [{ json: { error: (error as Error).message } }];
		}
		throw error;
	}
}

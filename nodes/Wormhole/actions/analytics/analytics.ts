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
import { wormholeApiRequest } from '../../transport/wormholeClient';
import { getChainOptions } from '../../utils/chainUtils';
import { cleanObject, formatTimestamp } from '../../utils/helpers';

export const analyticsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['analytics'],
			},
		},
		options: [
			{
				name: 'Get Historical Volume',
				value: 'getHistoricalVolume',
				description: 'Get time-series volume data',
				action: 'Get historical volume data',
			},
			{
				name: 'Get Protocol Stats',
				value: 'getProtocolStats',
				description: 'Get overall protocol metrics',
				action: 'Get protocol statistics',
			},
			{
				name: 'Get Top Tokens',
				value: 'getTopTokens',
				description: 'Get most bridged tokens',
				action: 'Get top bridged tokens',
			},
			{
				name: 'Get Transaction Count',
				value: 'getTransactionCount',
				description: 'Get activity metrics',
				action: 'Get transaction count',
			},
			{
				name: 'Get TVL',
				value: 'getTVL',
				description: 'Get total value locked',
				action: 'Get total value locked',
			},
			{
				name: 'Get Volume by Chain',
				value: 'getVolumeByChain',
				description: 'Get volume breakdown by chain',
				action: 'Get volume by chain',
			},
		],
		default: 'getProtocolStats',
	},
];

export const analyticsFields: INodeProperties[] = [
	// getProtocolStats fields
	{
		displayName: 'Include Chain Breakdown',
		name: 'includeChainBreakdown',
		type: 'boolean',
		default: false,
		description: 'Whether to include per-chain statistics',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getProtocolStats'],
			},
		},
	},

	// getVolumeByChain fields
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Filter by specific chain (leave empty for all chains)',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getVolumeByChain'],
			},
		},
	},
	{
		displayName: 'Time Range',
		name: 'timeRange',
		type: 'options',
		options: [
			{ name: '24 Hours', value: '24h' },
			{ name: '7 Days', value: '7d' },
			{ name: '30 Days', value: '30d' },
			{ name: '90 Days', value: '90d' },
			{ name: 'All Time', value: 'all' },
		],
		default: '7d',
		description: 'Time period for volume data',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getVolumeByChain', 'getHistoricalVolume', 'getTransactionCount'],
			},
		},
	},

	// getTopTokens fields
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 10,
		description: 'Maximum number of tokens to return',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getTopTokens'],
			},
		},
	},
	{
		displayName: 'Sort By',
		name: 'sortBy',
		type: 'options',
		options: [
			{ name: 'Volume', value: 'volume' },
			{ name: 'Transaction Count', value: 'txCount' },
			{ name: 'Unique Users', value: 'users' },
		],
		default: 'volume',
		description: 'Metric to sort tokens by',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getTopTokens'],
			},
		},
	},
	{
		displayName: 'Time Range',
		name: 'timeRange',
		type: 'options',
		options: [
			{ name: '24 Hours', value: '24h' },
			{ name: '7 Days', value: '7d' },
			{ name: '30 Days', value: '30d' },
			{ name: 'All Time', value: 'all' },
		],
		default: '7d',
		description: 'Time period for top tokens data',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getTopTokens'],
			},
		},
	},

	// getHistoricalVolume fields
	{
		displayName: 'Granularity',
		name: 'granularity',
		type: 'options',
		options: [
			{ name: 'Hourly', value: 'hour' },
			{ name: 'Daily', value: 'day' },
			{ name: 'Weekly', value: 'week' },
			{ name: 'Monthly', value: 'month' },
		],
		default: 'day',
		description: 'Data point granularity',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getHistoricalVolume'],
			},
		},
	},
	{
		displayName: 'Chain Filter',
		name: 'chainFilter',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Filter by specific chain (leave empty for all chains)',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getHistoricalVolume'],
			},
		},
	},

	// getTransactionCount fields
	{
		displayName: 'Chain Filter',
		name: 'chainFilter',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Filter by specific chain (leave empty for all chains)',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getTransactionCount'],
			},
		},
	},
	{
		displayName: 'Group By',
		name: 'groupBy',
		type: 'options',
		options: [
			{ name: 'None', value: 'none' },
			{ name: 'Chain', value: 'chain' },
			{ name: 'Token', value: 'token' },
			{ name: 'Day', value: 'day' },
		],
		default: 'none',
		description: 'How to group transaction counts',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getTransactionCount'],
			},
		},
	},

	// getTVL fields
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Filter by specific chain (leave empty for all chains)',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getTVL'],
			},
		},
	},
	{
		displayName: 'Include Token Breakdown',
		name: 'includeTokenBreakdown',
		type: 'boolean',
		default: false,
		description: 'Whether to include TVL breakdown by token',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getTVL'],
			},
		},
	},
];

export async function executeAnalytics(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: unknown;

	try {
		switch (operation) {
			case 'getProtocolStats': {
				const includeChainBreakdown = this.getNodeParameter('includeChainBreakdown', index, false) as boolean;

				const queryParams = cleanObject({
					includeChainBreakdown: includeChainBreakdown ? 'true' : undefined,
				});

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: '/api/v1/stats',
					query: queryParams,
				});
				break;
			}

			case 'getVolumeByChain': {
				const chain = this.getNodeParameter('chain', index, '') as string;
				const timeRange = this.getNodeParameter('timeRange', index, '7d') as string;

				const queryParams = cleanObject({
					timeRange,
					chain: chain || undefined,
				});

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: '/api/v1/stats/volume',
					query: queryParams,
				});
				break;
			}

			case 'getTopTokens': {
				const limit = this.getNodeParameter('limit', index, 10) as number;
				const sortBy = this.getNodeParameter('sortBy', index, 'volume') as string;
				const timeRange = this.getNodeParameter('timeRange', index, '7d') as string;

				const queryParams = cleanObject({
					limit: limit.toString(),
					sortBy,
					timeRange,
				});

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: '/api/v1/stats/tokens',
					query: queryParams,
				});
				break;
			}

			case 'getHistoricalVolume': {
				const timeRange = this.getNodeParameter('timeRange', index, '7d') as string;
				const granularity = this.getNodeParameter('granularity', index, 'day') as string;
				const chainFilter = this.getNodeParameter('chainFilter', index, '') as string;

				const queryParams = cleanObject({
					timeRange,
					granularity,
					chain: chainFilter || undefined,
				});

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: '/api/v1/stats/volume/history',
					query: queryParams,
				});

				// Format timestamps in response
				if (Array.isArray(responseData)) {
					responseData = responseData.map((item: { timestamp?: string | number }) => ({
						...item,
						timestamp: item.timestamp ? formatTimestamp(String(item.timestamp)) : undefined,
					}));
				}
				break;
			}

			case 'getTransactionCount': {
				const timeRange = this.getNodeParameter('timeRange', index, '7d') as string;
				const chainFilter = this.getNodeParameter('chainFilter', index, '') as string;
				const groupBy = this.getNodeParameter('groupBy', index, 'none') as string;

				const queryParams = cleanObject({
					timeRange,
					chain: chainFilter || undefined,
					groupBy: groupBy !== 'none' ? groupBy : undefined,
				});

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: '/api/v1/stats/transactions',
					query: queryParams,
				});
				break;
			}

			case 'getTVL': {
				const chain = this.getNodeParameter('chain', index, '') as string;
				const includeTokenBreakdown = this.getNodeParameter('includeTokenBreakdown', index, false) as boolean;

				const queryParams = cleanObject({
					chain: chain || undefined,
					includeTokenBreakdown: includeTokenBreakdown ? 'true' : undefined,
				});

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: '/api/v1/stats/tvl',
					query: queryParams,
				});
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

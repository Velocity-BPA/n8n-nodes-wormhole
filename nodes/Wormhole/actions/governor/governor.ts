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

export const governorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['governor'],
			},
		},
		options: [
			{
				name: 'Get Available Notional',
				value: 'getAvailableNotional',
				description: 'Get transfer limits per chain',
				action: 'Get available notional',
			},
			{
				name: 'Get Enqueued VAAs',
				value: 'getEnqueuedVAAs',
				description: 'Get pending large transfers',
				action: 'Get enqueued VAAs',
			},
			{
				name: 'Get Governor Config',
				value: 'getGovernorConfig',
				description: 'Get limit configuration',
				action: 'Get governor config',
			},
			{
				name: 'Get Governor Status',
				value: 'getGovernorStatus',
				description: 'Get governor info',
				action: 'Get governor status',
			},
		],
		default: 'getGovernorStatus',
	},
];

export const governorFields: INodeProperties[] = [
	// getGovernorStatus fields
	{
		displayName: 'Include Chain Details',
		name: 'includeChainDetails',
		type: 'boolean',
		default: false,
		description: 'Whether to include detailed per-chain governor status',
		displayOptions: {
			show: {
				resource: ['governor'],
				operation: ['getGovernorStatus'],
			},
		},
	},

	// getAvailableNotional fields
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Get available notional for specific chain (leave empty for all chains)',
		displayOptions: {
			show: {
				resource: ['governor'],
				operation: ['getAvailableNotional'],
			},
		},
	},

	// getEnqueuedVAAs fields
	{
		displayName: 'Chain Filter',
		name: 'chainFilter',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Filter enqueued VAAs by chain',
		displayOptions: {
			show: {
				resource: ['governor'],
				operation: ['getEnqueuedVAAs'],
			},
		},
	},
	{
		displayName: 'Sort By',
		name: 'sortBy',
		type: 'options',
		options: [
			{ name: 'Amount (Descending)', value: 'amountDesc' },
			{ name: 'Amount (Ascending)', value: 'amountAsc' },
			{ name: 'Time (Newest First)', value: 'timeDesc' },
			{ name: 'Time (Oldest First)', value: 'timeAsc' },
		],
		default: 'timeDesc',
		description: 'How to sort enqueued VAAs',
		displayOptions: {
			show: {
				resource: ['governor'],
				operation: ['getEnqueuedVAAs'],
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
		description: 'Maximum number of enqueued VAAs to return',
		displayOptions: {
			show: {
				resource: ['governor'],
				operation: ['getEnqueuedVAAs'],
			},
		},
	},

	// getGovernorConfig fields
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Get config for specific chain (leave empty for all chains)',
		displayOptions: {
			show: {
				resource: ['governor'],
				operation: ['getGovernorConfig'],
			},
		},
	},
];

export async function executeGovernor(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: unknown;

	try {
		switch (operation) {
			case 'getGovernorStatus': {
				const includeChainDetails = this.getNodeParameter('includeChainDetails', index, false) as boolean;

				const queryParams = cleanObject({
					includeChainDetails: includeChainDetails ? 'true' : undefined,
				});

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: '/api/v1/governor/status',
					query: queryParams,
				});

				// Format timestamps
				const status = responseData as Record<string, unknown>;
				if (status.lastUpdated) {
					status.lastUpdated = formatTimestamp(String(status.lastUpdated));
				}
				break;
			}

			case 'getAvailableNotional': {
				const chain = this.getNodeParameter('chain', index, '') as string;

				let endpoint = '/api/v1/governor/notional';
				if (chain) {
					endpoint = `/api/v1/governor/notional/${chain}`;
				}

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint,
				});
				break;
			}

			case 'getEnqueuedVAAs': {
				const chainFilter = this.getNodeParameter('chainFilter', index, '') as string;
				const sortBy = this.getNodeParameter('sortBy', index, 'timeDesc') as string;
				const limit = this.getNodeParameter('limit', index, 50) as number;

				const queryParams = cleanObject({
					chain: chainFilter || undefined,
					sortBy,
					pageSize: limit.toString(),
				});

				const response = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: '/api/v1/governor/enqueued',
					query: queryParams,
				});
				responseData = (response as { vaas?: unknown[] }).vaas || response;

				// Format timestamps
				if (Array.isArray(responseData)) {
					responseData = responseData.map((vaa: Record<string, unknown>) => ({
						...vaa,
						enqueuedAt: vaa.enqueuedAt ? formatTimestamp(String(vaa.enqueuedAt)) : undefined,
						releaseTime: vaa.releaseTime ? formatTimestamp(String(vaa.releaseTime)) : undefined,
					}));
				}
				break;
			}

			case 'getGovernorConfig': {
				const chain = this.getNodeParameter('chain', index, '') as string;

				let endpoint = '/api/v1/governor/config';
				if (chain) {
					endpoint = `/api/v1/governor/config/${chain}`;
				}

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint,
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

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

export const queriesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['queries'],
			},
		},
		options: [
			{
				name: 'Create Query',
				value: 'createQuery',
				description: 'Create cross-chain query',
				action: 'Create cross chain query',
			},
			{
				name: 'Get Query Result',
				value: 'getQueryResult',
				description: 'Get query response',
				action: 'Get query result',
			},
			{
				name: 'Get Supported Queries',
				value: 'getSupportedQueries',
				description: 'List available query types',
				action: 'Get supported query types',
			},
		],
		default: 'getSupportedQueries',
	},
];

export const queriesFields: INodeProperties[] = [
	// createQuery fields
	{
		displayName: 'Query Type',
		name: 'queryType',
		type: 'options',
		options: [
			{ name: 'ETH Call', value: 'eth_call' },
			{ name: 'ETH Call By Timestamp', value: 'eth_call_by_timestamp' },
			{ name: 'ETH Call With Finality', value: 'eth_call_with_finality' },
			{ name: 'Solana Account', value: 'sol_account' },
			{ name: 'Solana PDA', value: 'sol_pda' },
		],
		required: true,
		default: 'eth_call',
		description: 'Type of cross-chain query',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
			},
		},
	},
	{
		displayName: 'Target Chain',
		name: 'targetChain',
		type: 'options',
		options: getChainOptions(),
		required: true,
		default: '',
		description: 'Chain to query',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
			},
		},
	},
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		required: true,
		default: '',
		description: 'Contract address to query',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
			},
		},
	},
	{
		displayName: 'Call Data',
		name: 'callData',
		type: 'string',
		required: true,
		default: '',
		description: 'Encoded call data (hex string)',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['eth_call', 'eth_call_by_timestamp', 'eth_call_with_finality'],
			},
		},
	},
	{
		displayName: 'Account Address',
		name: 'accountAddress',
		type: 'string',
		required: true,
		default: '',
		description: 'Solana account address to query',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['sol_account'],
			},
		},
	},
	{
		displayName: 'Program ID',
		name: 'programId',
		type: 'string',
		required: true,
		default: '',
		description: 'Solana program ID for PDA query',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['sol_pda'],
			},
		},
	},
	{
		displayName: 'Seeds',
		name: 'seeds',
		type: 'json',
		required: true,
		default: '[]',
		description: 'PDA seeds as JSON array',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['sol_pda'],
			},
		},
	},
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'string',
		default: 'latest',
		description: 'Block number to query (or "latest")',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['eth_call'],
			},
		},
	},
	{
		displayName: 'Target Timestamp',
		name: 'targetTimestamp',
		type: 'number',
		default: 0,
		description: 'Unix timestamp to query at',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['eth_call_by_timestamp'],
			},
		},
	},
	{
		displayName: 'Finality',
		name: 'finality',
		type: 'options',
		options: [
			{ name: 'Finalized', value: 'finalized' },
			{ name: 'Safe', value: 'safe' },
		],
		default: 'finalized',
		description: 'Block finality requirement',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['eth_call_with_finality'],
			},
		},
	},
	{
		displayName: 'Commitment',
		name: 'commitment',
		type: 'options',
		options: [
			{ name: 'Finalized', value: 'finalized' },
			{ name: 'Confirmed', value: 'confirmed' },
		],
		default: 'finalized',
		description: 'Solana commitment level',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['sol_account', 'sol_pda'],
			},
		},
	},
	{
		displayName: 'Min Context Slot',
		name: 'minContextSlot',
		type: 'number',
		default: 0,
		description: 'Minimum slot for context',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['sol_account', 'sol_pda'],
			},
		},
	},
	{
		displayName: 'Data Slice Offset',
		name: 'dataSliceOffset',
		type: 'number',
		default: 0,
		description: 'Offset for data slice',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['sol_account', 'sol_pda'],
			},
		},
	},
	{
		displayName: 'Data Slice Length',
		name: 'dataSliceLength',
		type: 'number',
		default: 0,
		description: 'Length of data slice (0 for all)',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['createQuery'],
				queryType: ['sol_account', 'sol_pda'],
			},
		},
	},

	// getQueryResult fields
	{
		displayName: 'Query ID',
		name: 'queryId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the query to get results for',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['getQueryResult'],
			},
		},
	},
	{
		displayName: 'Wait For Result',
		name: 'waitForResult',
		type: 'boolean',
		default: false,
		description: 'Whether to wait for query result (will poll)',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['getQueryResult'],
			},
		},
	},
	{
		displayName: 'Timeout (Seconds)',
		name: 'timeout',
		type: 'number',
		typeOptions: {
			minValue: 5,
			maxValue: 120,
		},
		default: 30,
		description: 'Maximum time to wait for result',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['getQueryResult'],
				waitForResult: [true],
			},
		},
	},

	// getSupportedQueries fields
	{
		displayName: 'Chain Filter',
		name: 'chainFilter',
		type: 'options',
		options: getChainOptions(),
		default: '',
		description: 'Filter supported queries by chain',
		displayOptions: {
			show: {
				resource: ['queries'],
				operation: ['getSupportedQueries'],
			},
		},
	},
];

export async function executeQueries(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: unknown;

	try {
		switch (operation) {
			case 'createQuery': {
				const queryType = this.getNodeParameter('queryType', index) as string;
				const targetChain = this.getNodeParameter('targetChain', index) as string;
				const contractAddress = this.getNodeParameter('contractAddress', index) as string;

				const body: IDataObject = {
					type: queryType,
					chain: targetChain,
					contract: contractAddress,
				};

				// Add type-specific fields
				if (queryType === 'eth_call') {
					body.callData = this.getNodeParameter('callData', index) as string;
					body.block = this.getNodeParameter('blockNumber', index, 'latest') as string;
				} else if (queryType === 'eth_call_by_timestamp') {
					body.callData = this.getNodeParameter('callData', index) as string;
					body.targetTimestamp = this.getNodeParameter('targetTimestamp', index) as number;
				} else if (queryType === 'eth_call_with_finality') {
					body.callData = this.getNodeParameter('callData', index) as string;
					body.finality = this.getNodeParameter('finality', index) as string;
				} else if (queryType === 'sol_account') {
					body.account = this.getNodeParameter('accountAddress', index) as string;
					body.commitment = this.getNodeParameter('commitment', index) as string;
					const minSlot = this.getNodeParameter('minContextSlot', index, 0) as number;
					if (minSlot > 0) body.minContextSlot = minSlot;
					const offset = this.getNodeParameter('dataSliceOffset', index, 0) as number;
					const length = this.getNodeParameter('dataSliceLength', index, 0) as number;
					if (offset > 0 || length > 0) {
						body.dataSlice = { offset, length };
					}
				} else if (queryType === 'sol_pda') {
					body.programId = this.getNodeParameter('programId', index) as string;
					body.seeds = JSON.parse(this.getNodeParameter('seeds', index) as string);
					body.commitment = this.getNodeParameter('commitment', index) as string;
					const minSlot = this.getNodeParameter('minContextSlot', index, 0) as number;
					if (minSlot > 0) body.minContextSlot = minSlot;
					const offset = this.getNodeParameter('dataSliceOffset', index, 0) as number;
					const length = this.getNodeParameter('dataSliceLength', index, 0) as number;
					if (offset > 0 || length > 0) {
						body.dataSlice = { offset, length };
					}
				}

				responseData = await wormholeApiRequest.call(this, {
					method: 'POST',
					endpoint: '/api/v1/queries',
					body,
				});

				// Format timestamps
				const result = responseData as Record<string, unknown>;
				if (result.createdAt) {
					result.createdAt = formatTimestamp(String(result.createdAt));
				}
				break;
			}

			case 'getQueryResult': {
				const queryId = this.getNodeParameter('queryId', index) as string;
				const waitForResult = this.getNodeParameter('waitForResult', index, false) as boolean;

				if (waitForResult) {
					const timeout = this.getNodeParameter('timeout', index, 30) as number;
					const startTime = Date.now();
					const pollInterval = 2000; // 2 seconds

					while (Date.now() - startTime < timeout * 1000) {
						responseData = await wormholeApiRequest.call(this, {
							method: 'GET',
							endpoint: `/api/v1/queries/${queryId}`,
						});

						const result = responseData as Record<string, unknown>;
						if (result.status === 'completed' || result.status === 'failed') {
							break;
						}

						// Wait before polling again
						await new Promise(resolve => setTimeout(resolve, pollInterval));
					}
				} else {
					responseData = await wormholeApiRequest.call(this, {
						method: 'GET',
						endpoint: `/api/v1/queries/${queryId}`,
					});
				}

				// Format timestamps
				const result = responseData as Record<string, unknown>;
				if (result.createdAt) {
					result.createdAt = formatTimestamp(String(result.createdAt));
				}
				if (result.completedAt) {
					result.completedAt = formatTimestamp(String(result.completedAt));
				}
				break;
			}

			case 'getSupportedQueries': {
				const chainFilter = this.getNodeParameter('chainFilter', index, '') as string;

				const queryParams = cleanObject({
					chain: chainFilter || undefined,
				});

				responseData = await wormholeApiRequest.call(this, {
					method: 'GET',
					endpoint: '/api/v1/queries/supported',
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

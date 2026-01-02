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
import { getChainOptions, getChainId, getChainName, isValidChainId, isValidChainName } from '../../utils/chainUtils';
import { encodeAddress, decodeAddress, validateAddress } from '../../utils/addressUtils';

export const utilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Decode Address',
				value: 'decodeAddress',
				description: 'Parse chain-specific address from Wormhole format',
				action: 'Decode address',
			},
			{
				name: 'Encode Address',
				value: 'encodeAddress',
				description: 'Format address for specific chain',
				action: 'Encode address',
			},
			{
				name: 'Get API Health',
				value: 'getAPIHealth',
				description: 'Check service status',
				action: 'Get API health status',
			},
			{
				name: 'Get Chain ID',
				value: 'getChainID',
				description: 'Get Wormhole chain ID from name',
				action: 'Get chain ID',
			},
			{
				name: 'Validate VAA',
				value: 'validateVAA',
				description: 'Verify VAA signatures',
				action: 'Validate VAA',
			},
		],
		default: 'getAPIHealth',
	},
];

export const utilityFields: INodeProperties[] = [
	// encodeAddress fields
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		description: 'Native address to encode',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['encodeAddress'],
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
		description: 'Chain the address belongs to',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['encodeAddress'],
			},
		},
	},

	// decodeAddress fields
	{
		displayName: 'Encoded Address',
		name: 'encodedAddress',
		type: 'string',
		required: true,
		default: '',
		description: '32-byte Wormhole encoded address (hex)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['decodeAddress'],
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
		description: 'Target chain for address format',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['decodeAddress'],
			},
		},
	},

	// getChainID fields
	{
		displayName: 'Chain Name or ID',
		name: 'chainInput',
		type: 'string',
		required: true,
		default: '',
		description: 'Chain name (e.g., "ethereum", "solana") or numeric ID',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getChainID'],
			},
		},
	},

	// validateVAA fields
	{
		displayName: 'VAA',
		name: 'vaa',
		type: 'string',
		required: true,
		default: '',
		description: 'VAA bytes as hex string or base64',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateVAA'],
			},
		},
	},
	{
		displayName: 'Check Signatures',
		name: 'checkSignatures',
		type: 'boolean',
		default: true,
		description: 'Whether to verify guardian signatures',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateVAA'],
			},
		},
	},

	// getAPIHealth fields
	{
		displayName: 'Include Services',
		name: 'includeServices',
		type: 'boolean',
		default: false,
		description: 'Whether to include detailed service status',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getAPIHealth'],
			},
		},
	},
];

export async function executeUtility(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: unknown;

	try {
		switch (operation) {
			case 'encodeAddress': {
				const address = this.getNodeParameter('address', index) as string;
				const chain = this.getNodeParameter('chain', index) as string;

				// Validate address format for chain
				if (!validateAddress(address, parseInt(chain, 10))) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid address format for chain ${chain}`,
					);
				}

				const chainId = parseInt(chain, 10);
				const encoded = encodeAddress(address, chainId);

				responseData = {
					originalAddress: address,
					encodedAddress: encoded,
					chain: chainId,
					chainName: getChainName(chainId),
				};
				break;
			}

			case 'decodeAddress': {
				const encodedAddress = this.getNodeParameter('encodedAddress', index) as string;
				const chain = this.getNodeParameter('chain', index) as string;

				const chainId = parseInt(chain, 10);
				const decoded = decodeAddress(encodedAddress, chainId);

				responseData = {
					encodedAddress,
					decodedAddress: decoded,
					chain: chainId,
					chainName: getChainName(chainId),
				};
				break;
			}

			case 'getChainID': {
				const chainInput = this.getNodeParameter('chainInput', index) as string;

				// Check if input is numeric
				const numericId = parseInt(chainInput, 10);
				if (!isNaN(numericId) && isValidChainId(numericId)) {
					responseData = {
						chainId: numericId,
						chainName: getChainName(numericId),
						input: chainInput,
						inputType: 'id',
					};
				} else if (isValidChainName(chainInput.toLowerCase())) {
					const chainId = getChainId(chainInput.toLowerCase());
					responseData = {
						chainId,
						chainName: chainInput.toLowerCase(),
						input: chainInput,
						inputType: 'name',
					};
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unknown chain: ${chainInput}. Provide a valid chain name or Wormhole chain ID.`,
					);
				}
				break;
			}

			case 'validateVAA': {
				const vaa = this.getNodeParameter('vaa', index) as string;
				const checkSignatures = this.getNodeParameter('checkSignatures', index, true) as boolean;

				const body = {
					vaa,
					checkSignatures,
				};

				responseData = await wormholeApiRequest.call(this, {
					method: 'POST',
					endpoint: '/api/v1/vaas/validate',
					body,
				});
				break;
			}

			case 'getAPIHealth': {
				const includeServices = this.getNodeParameter('includeServices', index, false) as boolean;

				const endpoint = includeServices ? '/api/v1/health?detailed=true' : '/api/v1/health';

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

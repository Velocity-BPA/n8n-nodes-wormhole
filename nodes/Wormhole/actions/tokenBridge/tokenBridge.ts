/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  IDataObject,
} from 'n8n-workflow';

import { wormholeApiRequest } from '../../transport/wormholeClient';
import { encodeAddress } from '../../utils/addressUtils';

export const tokenBridgeOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['tokenBridge'],
      },
    },
    options: [
      {
        name: 'Attest Token',
        value: 'attestToken',
        description: 'Register token for cross-chain transfers',
        action: 'Attest token',
      },
      {
        name: 'Get Attestation',
        value: 'getAttestation',
        description: 'Get token registration status',
        action: 'Get attestation',
      },
      {
        name: 'Get Wrapped Token',
        value: 'getWrappedToken',
        description: 'Find wrapped token address on destination',
        action: 'Get wrapped token',
      },
      {
        name: 'Get Original Token',
        value: 'getOriginalToken',
        description: 'Find native token from wrapped address',
        action: 'Get original token',
      },
      {
        name: 'Get Supported Tokens',
        value: 'getSupportedTokens',
        description: 'List bridgeable tokens',
        action: 'Get supported tokens',
      },
    ],
    default: 'getAttestation',
  },
];

export const tokenBridgeFields: INodeProperties[] = [
  // Attestation fields
  {
    displayName: 'Token Address',
    name: 'tokenAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenBridge'],
        operation: ['attestToken', 'getAttestation', 'getWrappedToken', 'getOriginalToken'],
      },
    },
    default: '',
    description: 'The token contract address',
  },
  {
    displayName: 'Token Chain ID',
    name: 'tokenChain',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenBridge'],
        operation: ['attestToken', 'getAttestation', 'getWrappedToken', 'getOriginalToken'],
      },
    },
    default: 2,
    description: 'The Wormhole chain ID where the token is native',
  },
  // Wrapped token additional fields
  {
    displayName: 'Destination Chain ID',
    name: 'destinationChain',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenBridge'],
        operation: ['getWrappedToken'],
      },
    },
    default: 1,
    description: 'The Wormhole chain ID of the destination chain',
  },
  // Get original token fields
  {
    displayName: 'Wrapped Token Chain ID',
    name: 'wrappedTokenChain',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['tokenBridge'],
        operation: ['getOriginalToken'],
      },
    },
    default: 0,
    description: 'The chain ID where the wrapped token exists',
  },
  // Supported tokens filters
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['tokenBridge'],
        operation: ['getSupportedTokens'],
      },
    },
    options: [
      {
        displayName: 'Chain ID',
        name: 'chainId',
        type: 'number',
        default: 0,
        description: 'Filter tokens by chain',
      },
      {
        displayName: 'Symbol',
        name: 'symbol',
        type: 'string',
        default: '',
        description: 'Filter by token symbol',
      },
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        default: 1,
        description: 'Page number',
      },
      {
        displayName: 'Page Size',
        name: 'pageSize',
        type: 'number',
        default: 50,
        description: 'Results per page',
      },
    ],
  },
  // Attest token additional fields
  {
    displayName: 'Attestation Options',
    name: 'attestOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['tokenBridge'],
        operation: ['attestToken'],
      },
    },
    options: [
      {
        displayName: 'Sender Address',
        name: 'senderAddress',
        type: 'string',
        default: '',
        description: 'The address that will submit the attestation transaction',
      },
      {
        displayName: 'Destination Chains',
        name: 'destinationChains',
        type: 'string',
        default: '',
        description: 'Comma-separated list of destination chain IDs',
      },
    ],
  },
];

export async function executeTokenBridge(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    let response: IDataObject;

    switch (operation) {
      case 'attestToken': {
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
        const tokenChain = this.getNodeParameter('tokenChain', index) as number;
        const attestOptions = this.getNodeParameter('attestOptions', index, {}) as IDataObject;
        
        const body: IDataObject = {
          tokenAddress: encodeAddress(tokenAddress, tokenChain),
          tokenChain,
        };
        
        if (attestOptions.senderAddress) {
          body.senderAddress = encodeAddress(attestOptions.senderAddress as string, tokenChain);
        }
        
        if (attestOptions.destinationChains) {
          body.destinationChains = (attestOptions.destinationChains as string)
            .split(',')
            .map((c) => parseInt(c.trim(), 10));
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'POST',
          endpoint: '/api/v1/token-bridge/attest',
          body,
        });
        break;
      }

      case 'getAttestation': {
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
        const tokenChain = this.getNodeParameter('tokenChain', index) as number;
        
        const encodedAddress = encodeAddress(tokenAddress, tokenChain);
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/token-bridge/attestation/${tokenChain}/${encodedAddress}`,
        });
        break;
      }

      case 'getWrappedToken': {
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
        const tokenChain = this.getNodeParameter('tokenChain', index) as number;
        const destinationChain = this.getNodeParameter('destinationChain', index) as number;
        
        const encodedAddress = encodeAddress(tokenAddress, tokenChain);
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/token-bridge/wrapped/${tokenChain}/${encodedAddress}/${destinationChain}`,
        });
        break;
      }

      case 'getOriginalToken': {
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
        const tokenChain = this.getNodeParameter('tokenChain', index) as number;
        const wrappedTokenChain = this.getNodeParameter('wrappedTokenChain', index, tokenChain) as number;
        
        const encodedAddress = encodeAddress(tokenAddress, wrappedTokenChain);
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/token-bridge/original/${wrappedTokenChain}/${encodedAddress}`,
        });
        break;
      }

      case 'getSupportedTokens': {
        const filters = this.getNodeParameter('filters', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/token-bridge/tokens',
          query: filters,
        });
        break;
      }

      default:
        throw new Error(`Operation ${operation} is not supported`);
    }

    returnData.push({
      json: response,
      pairedItem: { item: index },
    });
  } catch (error) {
    if (this.continueOnFail()) {
      returnData.push({
        json: { error: (error as Error).message },
        pairedItem: { item: index },
      });
    } else {
      throw error;
    }
  }

  return returnData;
}

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

export const nttOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['ntt'],
      },
    },
    options: [
      {
        name: 'Get NTT Quote',
        value: 'getNTTQuote',
        description: 'Get NTT transfer estimate',
        action: 'Get NTT quote',
      },
      {
        name: 'Send NTT',
        value: 'sendNTT',
        description: 'Initiate NTT transfer',
        action: 'Send NTT',
      },
      {
        name: 'Redeem NTT',
        value: 'redeemNTT',
        description: 'Complete NTT on destination',
        action: 'Redeem NTT',
      },
      {
        name: 'Get NTT Status',
        value: 'getNTTStatus',
        description: 'Track NTT transfer',
        action: 'Get NTT status',
      },
      {
        name: 'Get NTT Tokens',
        value: 'getNTTTokens',
        description: 'List NTT-supported tokens',
        action: 'Get NTT tokens',
      },
    ],
    default: 'getNTTQuote',
  },
];

export const nttFields: INodeProperties[] = [
  // Quote fields
  {
    displayName: 'Source Chain ID',
    name: 'sourceChain',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['getNTTQuote', 'sendNTT'],
      },
    },
    default: 2,
    description: 'The Wormhole chain ID of the source chain',
  },
  {
    displayName: 'Target Chain ID',
    name: 'targetChain',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['getNTTQuote', 'sendNTT', 'redeemNTT'],
      },
    },
    default: 1,
    description: 'The Wormhole chain ID of the target chain',
  },
  {
    displayName: 'Token Address',
    name: 'tokenAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['getNTTQuote', 'sendNTT'],
      },
    },
    default: '',
    description: 'The NTT token address',
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['getNTTQuote', 'sendNTT'],
      },
    },
    default: '',
    description: 'The amount to transfer',
  },
  // Send NTT fields
  {
    displayName: 'Sender Address',
    name: 'senderAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['sendNTT'],
      },
    },
    default: '',
    description: 'The sender address',
  },
  {
    displayName: 'Recipient Address',
    name: 'recipientAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['sendNTT'],
      },
    },
    default: '',
    description: 'The recipient address on the target chain',
  },
  // Redeem NTT fields
  {
    displayName: 'VAA',
    name: 'vaa',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['redeemNTT'],
      },
    },
    default: '',
    description: 'The VAA bytes in base64 encoding',
  },
  {
    displayName: 'Recipient Address',
    name: 'recipientAddress',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['redeemNTT'],
      },
    },
    default: '',
    description: 'Optional: Override recipient address',
  },
  // Status fields
  {
    displayName: 'Transaction Hash',
    name: 'txHash',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['getNTTStatus'],
      },
    },
    default: '',
    description: 'The source transaction hash',
  },
  {
    displayName: 'Chain ID',
    name: 'chainId',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['getNTTStatus'],
      },
    },
    default: 0,
    description: 'The Wormhole chain ID of the source chain',
  },
  // NTT tokens filters
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['getNTTTokens'],
      },
    },
    options: [
      {
        displayName: 'Chain ID',
        name: 'chainId',
        type: 'number',
        default: 0,
        description: 'Filter tokens by supported chain',
      },
      {
        displayName: 'Symbol',
        name: 'symbol',
        type: 'string',
        default: '',
        description: 'Filter by token symbol',
      },
    ],
  },
  // Send NTT options
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['ntt'],
        operation: ['sendNTT'],
      },
    },
    options: [
      {
        displayName: 'Use Relayer',
        name: 'useRelayer',
        type: 'boolean',
        default: true,
        description: 'Whether to use automatic relaying',
      },
      {
        displayName: 'Should Queue',
        name: 'shouldQueue',
        type: 'boolean',
        default: false,
        description: 'Whether to queue if rate limited',
      },
    ],
  },
];

export async function executeNTT(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    let response: IDataObject;

    switch (operation) {
      case 'getNTTQuote': {
        const sourceChain = this.getNodeParameter('sourceChain', index) as number;
        const targetChain = this.getNodeParameter('targetChain', index) as number;
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
        const amount = this.getNodeParameter('amount', index) as string;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/ntt/quote',
          query: {
            sourceChain,
            targetChain,
            tokenAddress: encodeAddress(tokenAddress, sourceChain),
            amount,
          },
        });
        break;
      }

      case 'sendNTT': {
        const sourceChain = this.getNodeParameter('sourceChain', index) as number;
        const targetChain = this.getNodeParameter('targetChain', index) as number;
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
        const amount = this.getNodeParameter('amount', index) as string;
        const senderAddress = this.getNodeParameter('senderAddress', index) as string;
        const recipientAddress = this.getNodeParameter('recipientAddress', index) as string;
        const options = this.getNodeParameter('options', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'POST',
          endpoint: '/api/v1/ntt/send',
          body: {
            sourceChain,
            targetChain,
            tokenAddress: encodeAddress(tokenAddress, sourceChain),
            amount,
            senderAddress: encodeAddress(senderAddress, sourceChain),
            recipientAddress: encodeAddress(recipientAddress, targetChain),
            ...options,
          },
        });
        break;
      }

      case 'redeemNTT': {
        const targetChain = this.getNodeParameter('targetChain', index) as number;
        const vaa = this.getNodeParameter('vaa', index) as string;
        const recipientAddress = this.getNodeParameter('recipientAddress', index, '') as string;
        
        const body: IDataObject = {
          targetChain,
          vaa,
        };
        
        if (recipientAddress) {
          body.recipientAddress = encodeAddress(recipientAddress, targetChain);
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'POST',
          endpoint: '/api/v1/ntt/redeem',
          body,
        });
        break;
      }

      case 'getNTTStatus': {
        const txHash = this.getNodeParameter('txHash', index) as string;
        const chainId = this.getNodeParameter('chainId', index) as number;
        
        const query: IDataObject = {};
        if (chainId) {
          query.chainId = chainId;
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/ntt/status/${txHash}`,
          query,
        });
        break;
      }

      case 'getNTTTokens': {
        const filters = this.getNodeParameter('filters', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/ntt/tokens',
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

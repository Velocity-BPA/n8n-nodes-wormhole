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

export const tokenTransfersOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['tokenTransfers'],
      },
    },
    options: [
      {
        name: 'Get Transfer Quote',
        value: 'getTransferQuote',
        description: 'Estimate transfer cost and time',
        action: 'Get transfer quote',
      },
      {
        name: 'Build Transfer',
        value: 'buildTransfer',
        description: 'Create transfer transaction data',
        action: 'Build transfer',
      },
      {
        name: 'Get Transfer Status',
        value: 'getTransferStatus',
        description: 'Track transfer progress by transaction hash',
        action: 'Get transfer status',
      },
      {
        name: 'Complete Transfer',
        value: 'completeTransfer',
        description: 'Build redemption transaction',
        action: 'Complete transfer',
      },
      {
        name: 'Get Transfer by Hash',
        value: 'getTransferByHash',
        description: 'Lookup transfer details',
        action: 'Get transfer by hash',
      },
      {
        name: 'List Transfers',
        value: 'listTransfers',
        description: 'Get transfer history by address',
        action: 'List transfers',
      },
    ],
    default: 'getTransferQuote',
  },
];

export const tokenTransfersFields: INodeProperties[] = [
  // Quote fields
  {
    displayName: 'Source Chain ID',
    name: 'sourceChain',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenTransfers'],
        operation: ['getTransferQuote', 'buildTransfer'],
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
        resource: ['tokenTransfers'],
        operation: ['getTransferQuote', 'buildTransfer', 'completeTransfer'],
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
        resource: ['tokenTransfers'],
        operation: ['getTransferQuote', 'buildTransfer'],
      },
    },
    default: '',
    description: 'The token address on the source chain',
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenTransfers'],
        operation: ['getTransferQuote', 'buildTransfer'],
      },
    },
    default: '',
    description: 'The amount to transfer (in smallest unit)',
  },
  // Build transfer additional fields
  {
    displayName: 'Sender Address',
    name: 'senderAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenTransfers'],
        operation: ['buildTransfer'],
      },
    },
    default: '',
    description: 'The sender address on the source chain',
  },
  {
    displayName: 'Recipient Address',
    name: 'recipientAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenTransfers'],
        operation: ['buildTransfer'],
      },
    },
    default: '',
    description: 'The recipient address on the target chain',
  },
  // Transaction hash fields
  {
    displayName: 'Transaction Hash',
    name: 'txHash',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenTransfers'],
        operation: ['getTransferStatus', 'getTransferByHash', 'completeTransfer'],
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
        resource: ['tokenTransfers'],
        operation: ['getTransferStatus', 'getTransferByHash'],
      },
    },
    default: 0,
    description: 'Optional: The Wormhole chain ID',
  },
  // List transfers fields
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tokenTransfers'],
        operation: ['listTransfers'],
      },
    },
    default: '',
    description: 'The wallet address to get transfer history for',
  },
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['tokenTransfers'],
        operation: ['listTransfers'],
      },
    },
    options: [
      {
        displayName: 'Chain ID',
        name: 'chainId',
        type: 'number',
        default: 0,
        description: 'Filter by chain ID',
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
      {
        displayName: 'Sort Order',
        name: 'sortOrder',
        type: 'options',
        options: [
          { name: 'Ascending', value: 'ASC' },
          { name: 'Descending', value: 'DESC' },
        ],
        default: 'DESC',
        description: 'Sort order',
      },
    ],
  },
  // Complete transfer additional fields
  {
    displayName: 'Recipient Address',
    name: 'recipientAddress',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['tokenTransfers'],
        operation: ['completeTransfer'],
      },
    },
    default: '',
    description: 'Optional: Override recipient address',
  },
];

export async function executeTokenTransfers(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    let response: IDataObject;

    switch (operation) {
      case 'getTransferQuote': {
        const sourceChain = this.getNodeParameter('sourceChain', index) as number;
        const targetChain = this.getNodeParameter('targetChain', index) as number;
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
        const amount = this.getNodeParameter('amount', index) as string;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/transfers/quote',
          query: {
            sourceChain,
            targetChain,
            tokenAddress: encodeAddress(tokenAddress, sourceChain),
            amount,
          },
        });
        break;
      }

      case 'buildTransfer': {
        const sourceChain = this.getNodeParameter('sourceChain', index) as number;
        const targetChain = this.getNodeParameter('targetChain', index) as number;
        const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
        const amount = this.getNodeParameter('amount', index) as string;
        const senderAddress = this.getNodeParameter('senderAddress', index) as string;
        const recipientAddress = this.getNodeParameter('recipientAddress', index) as string;
        
        response = await wormholeApiRequest.call(this, {
          method: 'POST',
          endpoint: '/api/v1/transfers/build',
          body: {
            sourceChain,
            targetChain,
            tokenAddress: encodeAddress(tokenAddress, sourceChain),
            amount,
            senderAddress: encodeAddress(senderAddress, sourceChain),
            recipientAddress: encodeAddress(recipientAddress, targetChain),
          },
        });
        break;
      }

      case 'getTransferStatus': {
        const txHash = this.getNodeParameter('txHash', index) as string;
        const chainId = this.getNodeParameter('chainId', index) as number;
        
        const query: IDataObject = {};
        if (chainId) {
          query.chainId = chainId;
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/transfers/status/${txHash}`,
          query,
        });
        break;
      }

      case 'completeTransfer': {
        const txHash = this.getNodeParameter('txHash', index) as string;
        const targetChain = this.getNodeParameter('targetChain', index) as number;
        const recipientAddress = this.getNodeParameter('recipientAddress', index, '') as string;
        
        const body: IDataObject = {
          txHash,
          targetChain,
        };
        
        if (recipientAddress) {
          body.recipientAddress = encodeAddress(recipientAddress, targetChain);
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'POST',
          endpoint: '/api/v1/transfers/redeem',
          body,
        });
        break;
      }

      case 'getTransferByHash': {
        const txHash = this.getNodeParameter('txHash', index) as string;
        const chainId = this.getNodeParameter('chainId', index) as number;
        
        const query: IDataObject = {};
        if (chainId) {
          query.chainId = chainId;
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/transfers/${txHash}`,
          query,
        });
        break;
      }

      case 'listTransfers': {
        const address = this.getNodeParameter('address', index) as string;
        const options = this.getNodeParameter('options', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/transfers',
          query: {
            address,
            ...options,
          },
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

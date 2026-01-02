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

export const chainsOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['chains'],
      },
    },
    options: [
      {
        name: 'Get Supported Chains',
        value: 'getSupportedChains',
        description: 'Get all connected chains',
        action: 'Get supported chains',
      },
      {
        name: 'Get Chain Info',
        value: 'getChainInfo',
        description: 'Get chain details (finality, contracts)',
        action: 'Get chain info',
      },
      {
        name: 'Get Chain Stats',
        value: 'getChainStats',
        description: 'Get chain metrics (volume, transactions)',
        action: 'Get chain stats',
      },
      {
        name: 'Get Emitter Address',
        value: 'getEmitterAddress',
        description: 'Get core bridge address for chain',
        action: 'Get emitter address',
      },
      {
        name: 'Get Contract Addresses',
        value: 'getContractAddresses',
        description: 'Get all Wormhole contracts for chain',
        action: 'Get contract addresses',
      },
    ],
    default: 'getSupportedChains',
  },
];

export const chainsFields: INodeProperties[] = [
  // Chain ID field
  {
    displayName: 'Chain ID',
    name: 'chainId',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['chains'],
        operation: ['getChainInfo', 'getChainStats', 'getEmitterAddress', 'getContractAddresses'],
      },
    },
    default: 2,
    description: 'The Wormhole chain ID',
  },
  // Supported chains filters
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['chains'],
        operation: ['getSupportedChains'],
      },
    },
    options: [
      {
        displayName: 'Network',
        name: 'network',
        type: 'options',
        options: [
          { name: 'All', value: 'all' },
          { name: 'Mainnet', value: 'mainnet' },
          { name: 'Testnet', value: 'testnet' },
        ],
        default: 'all',
        description: 'Filter by network type',
      },
      {
        displayName: 'EVM Only',
        name: 'evmOnly',
        type: 'boolean',
        default: false,
        description: 'Only return EVM-compatible chains',
      },
    ],
  },
  // Chain stats options
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['chains'],
        operation: ['getChainStats'],
      },
    },
    options: [
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
        default: '24h',
        description: 'Time range for statistics',
      },
      {
        displayName: 'Include Volume',
        name: 'includeVolume',
        type: 'boolean',
        default: true,
        description: 'Include volume metrics',
      },
    ],
  },
  // Contract type filter
  {
    displayName: 'Contract Type',
    name: 'contractType',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['chains'],
        operation: ['getEmitterAddress'],
      },
    },
    options: [
      { name: 'Core Bridge', value: 'core' },
      { name: 'Token Bridge', value: 'tokenBridge' },
      { name: 'NFT Bridge', value: 'nftBridge' },
      { name: 'Relayer', value: 'relayer' },
    ],
    default: 'core',
    description: 'The type of contract',
  },
];

export async function executeChains(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    let response: IDataObject;

    switch (operation) {
      case 'getSupportedChains': {
        const filters = this.getNodeParameter('filters', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/chains',
          query: filters,
        });
        break;
      }

      case 'getChainInfo': {
        const chainId = this.getNodeParameter('chainId', index) as number;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/chains/${chainId}`,
        });
        break;
      }

      case 'getChainStats': {
        const chainId = this.getNodeParameter('chainId', index) as number;
        const options = this.getNodeParameter('options', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/chains/${chainId}/stats`,
          query: options,
        });
        break;
      }

      case 'getEmitterAddress': {
        const chainId = this.getNodeParameter('chainId', index) as number;
        const contractType = this.getNodeParameter('contractType', index) as string;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/chains/${chainId}/emitter`,
          query: {
            contractType,
          },
        });
        break;
      }

      case 'getContractAddresses': {
        const chainId = this.getNodeParameter('chainId', index) as number;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/chains/${chainId}/contracts`,
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

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
import { encodeAddress, buildVaaId } from '../../utils/addressUtils';

export const vaaOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['vaa'],
      },
    },
    options: [
      {
        name: 'Get VAA by ID',
        value: 'getVAAByID',
        description: 'Lookup VAA by emitter chain, emitter address, and sequence',
        action: 'Get VAA by ID',
      },
      {
        name: 'Get VAA by Transaction',
        value: 'getVAAByTransaction',
        description: 'Find VAA by source transaction hash',
        action: 'Get VAA by transaction',
      },
      {
        name: 'Search VAAs',
        value: 'searchVAAs',
        description: 'Query VAAs with filters',
        action: 'Search VAAs',
      },
      {
        name: 'Get VAA Status',
        value: 'getVAAStatus',
        description: 'Get verification status of a VAA',
        action: 'Get VAA status',
      },
      {
        name: 'Parse VAA',
        value: 'parseVAA',
        description: 'Decode VAA payload and signatures',
        action: 'Parse VAA',
      },
      {
        name: 'Get Recent VAAs',
        value: 'getRecentVAAs',
        description: 'Get latest VAAs with pagination',
        action: 'Get recent VAAs',
      },
    ],
    default: 'getVAAByID',
  },
];

export const vaaFields: INodeProperties[] = [
  // getVAAByID fields
  {
    displayName: 'Emitter Chain ID',
    name: 'emitterChain',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['vaa'],
        operation: ['getVAAByID', 'getVAAStatus'],
      },
    },
    default: 2,
    description: 'The Wormhole chain ID of the emitter',
  },
  {
    displayName: 'Emitter Address',
    name: 'emitterAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['vaa'],
        operation: ['getVAAByID', 'getVAAStatus'],
      },
    },
    default: '',
    description: 'The address of the contract that emitted the VAA',
  },
  {
    displayName: 'Sequence',
    name: 'sequence',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['vaa'],
        operation: ['getVAAByID', 'getVAAStatus'],
      },
    },
    default: '',
    description: 'The sequence number of the VAA',
  },
  // getVAAByTransaction fields
  {
    displayName: 'Transaction Hash',
    name: 'txHash',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['vaa'],
        operation: ['getVAAByTransaction'],
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
        resource: ['vaa'],
        operation: ['getVAAByTransaction'],
      },
    },
    default: 0,
    description: 'Optional: The Wormhole chain ID where the transaction was submitted',
  },
  // searchVAAs fields
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['vaa'],
        operation: ['searchVAAs'],
      },
    },
    options: [
      {
        displayName: 'Emitter Chain',
        name: 'emitterChain',
        type: 'number',
        default: 0,
        description: 'Filter by emitter chain ID',
      },
      {
        displayName: 'Emitter Address',
        name: 'emitterAddress',
        type: 'string',
        default: '',
        description: 'Filter by emitter address',
      },
      {
        displayName: 'Target Chain',
        name: 'targetChain',
        type: 'number',
        default: 0,
        description: 'Filter by target chain ID',
      },
      {
        displayName: 'Payload Type',
        name: 'payloadType',
        type: 'string',
        default: '',
        description: 'Filter by payload type',
      },
      {
        displayName: 'Start Time',
        name: 'startTime',
        type: 'dateTime',
        default: '',
        description: 'Filter VAAs after this time',
      },
      {
        displayName: 'End Time',
        name: 'endTime',
        type: 'dateTime',
        default: '',
        description: 'Filter VAAs before this time',
      },
    ],
  },
  // parseVAA fields
  {
    displayName: 'VAA (Base64)',
    name: 'vaaBytes',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['vaa'],
        operation: ['parseVAA'],
      },
    },
    default: '',
    description: 'The VAA bytes in base64 encoding',
  },
  // getRecentVAAs fields
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['vaa'],
        operation: ['getRecentVAAs', 'searchVAAs'],
      },
    },
    options: [
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        default: 1,
        description: 'Page number for pagination',
      },
      {
        displayName: 'Page Size',
        name: 'pageSize',
        type: 'number',
        default: 50,
        description: 'Number of results per page',
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
        description: 'Sort order for results',
      },
    ],
  },
];

export async function executeVAA(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    let response: IDataObject;

    switch (operation) {
      case 'getVAAByID': {
        const emitterChain = this.getNodeParameter('emitterChain', index) as number;
        const emitterAddress = this.getNodeParameter('emitterAddress', index) as string;
        const sequence = this.getNodeParameter('sequence', index) as string;
        
        const encodedAddress = encodeAddress(emitterAddress, emitterChain);
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/vaas/${emitterChain}/${encodedAddress}/${sequence}`,
        });
        break;
      }

      case 'getVAAByTransaction': {
        const txHash = this.getNodeParameter('txHash', index) as string;
        const chainId = this.getNodeParameter('chainId', index) as number;
        
        const query: IDataObject = {};
        if (chainId) {
          query.chainId = chainId;
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/vaas/`,
          query: {
            txHash,
            ...query,
          },
        });
        break;
      }

      case 'searchVAAs': {
        const filters = this.getNodeParameter('filters', index, {}) as IDataObject;
        const options = this.getNodeParameter('options', index, {}) as IDataObject;
        
        const query: IDataObject = {
          ...options,
        };
        
        if (filters.emitterChain) {
          query.emitterChain = filters.emitterChain;
        }
        if (filters.emitterAddress) {
          query.emitterAddress = filters.emitterAddress;
        }
        if (filters.targetChain) {
          query.targetChain = filters.targetChain;
        }
        if (filters.payloadType) {
          query.payloadType = filters.payloadType;
        }
        if (filters.startTime) {
          query.startTime = filters.startTime;
        }
        if (filters.endTime) {
          query.endTime = filters.endTime;
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/vaas',
          query,
        });
        break;
      }

      case 'getVAAStatus': {
        const emitterChain = this.getNodeParameter('emitterChain', index) as number;
        const emitterAddress = this.getNodeParameter('emitterAddress', index) as string;
        const sequence = this.getNodeParameter('sequence', index) as string;
        
        const vaaId = buildVaaId(emitterChain, emitterAddress, sequence);
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/vaas/${vaaId}/status`,
        });
        break;
      }

      case 'parseVAA': {
        const vaaBytes = this.getNodeParameter('vaaBytes', index) as string;
        
        response = await wormholeApiRequest.call(this, {
          method: 'POST',
          endpoint: '/api/v1/vaas/parse',
          body: {
            vaa: vaaBytes,
          },
        });
        break;
      }

      case 'getRecentVAAs': {
        const options = this.getNodeParameter('options', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/vaas',
          query: options,
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

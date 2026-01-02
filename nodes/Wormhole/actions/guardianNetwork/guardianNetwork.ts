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

export const guardianNetworkOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['guardianNetwork'],
      },
    },
    options: [
      {
        name: 'Get Guardian Set',
        value: 'getGuardianSet',
        description: 'Get current guardian set',
        action: 'Get guardian set',
      },
      {
        name: 'Get Guardian Info',
        value: 'getGuardianInfo',
        description: 'Get individual guardian details',
        action: 'Get guardian info',
      },
      {
        name: 'Get Heartbeats',
        value: 'getHeartbeats',
        description: 'Get guardian health status',
        action: 'Get heartbeats',
      },
      {
        name: 'Get Network Status',
        value: 'getNetworkStatus',
        description: 'Get overall network status',
        action: 'Get network status',
      },
      {
        name: 'Get Signatures',
        value: 'getSignatures',
        description: 'Get VAA signatures breakdown',
        action: 'Get signatures',
      },
    ],
    default: 'getGuardianSet',
  },
];

export const guardianNetworkFields: INodeProperties[] = [
  // Guardian set index
  {
    displayName: 'Guardian Set Index',
    name: 'guardianSetIndex',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['guardianNetwork'],
        operation: ['getGuardianSet'],
      },
    },
    default: 0,
    description: 'Optional: Specific guardian set index (0 for current)',
  },
  // Guardian info fields
  {
    displayName: 'Guardian Address',
    name: 'guardianAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['guardianNetwork'],
        operation: ['getGuardianInfo'],
      },
    },
    default: '',
    description: 'The guardian address',
  },
  // Signatures fields
  {
    displayName: 'Emitter Chain ID',
    name: 'emitterChain',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['guardianNetwork'],
        operation: ['getSignatures'],
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
        resource: ['guardianNetwork'],
        operation: ['getSignatures'],
      },
    },
    default: '',
    description: 'The emitter contract address',
  },
  {
    displayName: 'Sequence',
    name: 'sequence',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['guardianNetwork'],
        operation: ['getSignatures'],
      },
    },
    default: '',
    description: 'The VAA sequence number',
  },
  // Heartbeats options
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['guardianNetwork'],
        operation: ['getHeartbeats'],
      },
    },
    options: [
      {
        displayName: 'Guardian Address',
        name: 'guardianAddress',
        type: 'string',
        default: '',
        description: 'Filter by specific guardian',
      },
      {
        displayName: 'Chain ID',
        name: 'chainId',
        type: 'number',
        default: 0,
        description: 'Filter heartbeats by chain',
      },
    ],
  },
];

export async function executeGuardianNetwork(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    let response: IDataObject;

    switch (operation) {
      case 'getGuardianSet': {
        const guardianSetIndex = this.getNodeParameter('guardianSetIndex', index, 0) as number;
        
        let endpoint = '/api/v1/guardians/set';
        if (guardianSetIndex > 0) {
          endpoint = `/api/v1/guardians/set/${guardianSetIndex}`;
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint,
        });
        break;
      }

      case 'getGuardianInfo': {
        const guardianAddress = this.getNodeParameter('guardianAddress', index) as string;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/guardians/${guardianAddress}`,
        });
        break;
      }

      case 'getHeartbeats': {
        const options = this.getNodeParameter('options', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/guardians/heartbeats',
          query: options,
        });
        break;
      }

      case 'getNetworkStatus': {
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/guardians/status',
        });
        break;
      }

      case 'getSignatures': {
        const emitterChain = this.getNodeParameter('emitterChain', index) as number;
        const emitterAddress = this.getNodeParameter('emitterAddress', index) as string;
        const sequence = this.getNodeParameter('sequence', index) as string;
        
        const encodedAddress = encodeAddress(emitterAddress, emitterChain);
        const vaaId = buildVaaId(emitterChain, encodedAddress, sequence);
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/vaas/${vaaId}/signatures`,
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

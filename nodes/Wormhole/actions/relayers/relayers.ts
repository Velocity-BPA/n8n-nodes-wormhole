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

export const relayersOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['relayers'],
      },
    },
    options: [
      {
        name: 'Get Relayer Status',
        value: 'getRelayerStatus',
        description: 'Get relayer health',
        action: 'Get relayer status',
      },
      {
        name: 'Get Delivery Quote',
        value: 'getDeliveryQuote',
        description: 'Get relayer fee estimate',
        action: 'Get delivery quote',
      },
      {
        name: 'Request Delivery',
        value: 'requestDelivery',
        description: 'Request relayer delivery',
        action: 'Request delivery',
      },
      {
        name: 'Track Delivery',
        value: 'trackDelivery',
        description: 'Track delivery status',
        action: 'Track delivery',
      },
      {
        name: 'Get Relayer Providers',
        value: 'getRelayerProviders',
        description: 'List available relayers',
        action: 'Get relayer providers',
      },
    ],
    default: 'getRelayerStatus',
  },
];

export const relayersFields: INodeProperties[] = [
  // Relayer ID field
  {
    displayName: 'Relayer ID',
    name: 'relayerId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['relayers'],
        operation: ['getRelayerStatus', 'getDeliveryQuote'],
      },
    },
    default: '',
    description: 'The relayer identifier (optional for default relayer)',
  },
  // Delivery quote fields
  {
    displayName: 'Source Chain ID',
    name: 'sourceChain',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['relayers'],
        operation: ['getDeliveryQuote', 'requestDelivery'],
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
        resource: ['relayers'],
        operation: ['getDeliveryQuote', 'requestDelivery'],
      },
    },
    default: 1,
    description: 'The Wormhole chain ID of the target chain',
  },
  // Request delivery fields
  {
    displayName: 'VAA ID',
    name: 'vaaId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['relayers'],
        operation: ['requestDelivery'],
      },
    },
    default: '',
    description: 'The VAA ID to deliver (emitterChain/emitterAddress/sequence)',
  },
  {
    displayName: 'Max Fee',
    name: 'maxFee',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['relayers'],
        operation: ['requestDelivery'],
      },
    },
    default: '',
    description: 'Maximum fee willing to pay',
  },
  // Track delivery fields
  {
    displayName: 'Delivery ID',
    name: 'deliveryId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['relayers'],
        operation: ['trackDelivery'],
      },
    },
    default: '',
    description: 'The delivery ID to track',
  },
  // Providers filter
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['relayers'],
        operation: ['getRelayerProviders'],
      },
    },
    options: [
      {
        displayName: 'Chain ID',
        name: 'chainId',
        type: 'number',
        default: 0,
        description: 'Filter by supported chain',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'All', value: 'all' },
          { name: 'Active', value: 'active' },
          { name: 'Inactive', value: 'inactive' },
        ],
        default: 'active',
        description: 'Filter by relayer status',
      },
    ],
  },
];

export async function executeRelayers(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    let response: IDataObject;

    switch (operation) {
      case 'getRelayerStatus': {
        const relayerId = this.getNodeParameter('relayerId', index, '') as string;
        
        let endpoint = '/api/v1/relayers/status';
        if (relayerId) {
          endpoint = `/api/v1/relayers/${relayerId}/status`;
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint,
        });
        break;
      }

      case 'getDeliveryQuote': {
        const sourceChain = this.getNodeParameter('sourceChain', index) as number;
        const targetChain = this.getNodeParameter('targetChain', index) as number;
        const relayerId = this.getNodeParameter('relayerId', index, '') as string;
        
        const query: IDataObject = {
          sourceChain,
          targetChain,
        };
        
        if (relayerId) {
          query.relayerId = relayerId;
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/relayers/quote',
          query,
        });
        break;
      }

      case 'requestDelivery': {
        const sourceChain = this.getNodeParameter('sourceChain', index) as number;
        const targetChain = this.getNodeParameter('targetChain', index) as number;
        const vaaId = this.getNodeParameter('vaaId', index) as string;
        const maxFee = this.getNodeParameter('maxFee', index, '') as string;
        
        const body: IDataObject = {
          sourceChain,
          targetChain,
          vaaId,
        };
        
        if (maxFee) {
          body.maxFee = maxFee;
        }
        
        response = await wormholeApiRequest.call(this, {
          method: 'POST',
          endpoint: '/api/v1/relayers/deliver',
          body,
        });
        break;
      }

      case 'trackDelivery': {
        const deliveryId = this.getNodeParameter('deliveryId', index) as string;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/relayers/delivery/${deliveryId}`,
        });
        break;
      }

      case 'getRelayerProviders': {
        const filters = this.getNodeParameter('filters', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/relayers',
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

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

export const messagesOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['messages'],
      },
    },
    options: [
      {
        name: 'Get Message',
        value: 'getMessage',
        description: 'Retrieve cross-chain message',
        action: 'Get message',
      },
      {
        name: 'Send Message',
        value: 'sendMessage',
        description: 'Build message transaction',
        action: 'Send message',
      },
      {
        name: 'Get Message Status',
        value: 'getMessageStatus',
        description: 'Check delivery status',
        action: 'Get message status',
      },
      {
        name: 'Parse Message',
        value: 'parseMessage',
        description: 'Decode message payload',
        action: 'Parse message',
      },
      {
        name: 'List Messages',
        value: 'listMessages',
        description: 'Get recent messages',
        action: 'List messages',
      },
    ],
    default: 'getMessage',
  },
];

export const messagesFields: INodeProperties[] = [
  // Get message fields
  {
    displayName: 'Emitter Chain ID',
    name: 'emitterChain',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['messages'],
        operation: ['getMessage', 'getMessageStatus'],
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
        resource: ['messages'],
        operation: ['getMessage', 'getMessageStatus'],
      },
    },
    default: '',
    description: 'The address of the emitting contract',
  },
  {
    displayName: 'Sequence',
    name: 'sequence',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['messages'],
        operation: ['getMessage', 'getMessageStatus'],
      },
    },
    default: '',
    description: 'The sequence number of the message',
  },
  // Send message fields
  {
    displayName: 'Source Chain ID',
    name: 'sourceChain',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['messages'],
        operation: ['sendMessage'],
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
        resource: ['messages'],
        operation: ['sendMessage'],
      },
    },
    default: 1,
    description: 'The Wormhole chain ID of the target chain',
  },
  {
    displayName: 'Target Address',
    name: 'targetAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['messages'],
        operation: ['sendMessage'],
      },
    },
    default: '',
    description: 'The target contract address',
  },
  {
    displayName: 'Payload',
    name: 'payload',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['messages'],
        operation: ['sendMessage'],
      },
    },
    default: '',
    description: 'The message payload (hex encoded)',
  },
  {
    displayName: 'Sender Address',
    name: 'senderAddress',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['messages'],
        operation: ['sendMessage'],
      },
    },
    default: '',
    description: 'The sender address',
  },
  // Parse message fields
  {
    displayName: 'Message Payload',
    name: 'messagePayload',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['messages'],
        operation: ['parseMessage'],
      },
    },
    default: '',
    description: 'The message payload to decode (hex or base64)',
  },
  {
    displayName: 'Payload Type',
    name: 'payloadType',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['messages'],
        operation: ['parseMessage'],
      },
    },
    options: [
      { name: 'Auto Detect', value: 'auto' },
      { name: 'Token Transfer', value: 'transfer' },
      { name: 'NFT Transfer', value: 'nft' },
      { name: 'Attestation', value: 'attestation' },
      { name: 'Generic', value: 'generic' },
    ],
    default: 'auto',
    description: 'The type of payload to decode',
  },
  // List messages filters
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['messages'],
        operation: ['listMessages'],
      },
    },
    options: [
      {
        displayName: 'Emitter Chain',
        name: 'emitterChain',
        type: 'number',
        default: 0,
        description: 'Filter by emitter chain',
      },
      {
        displayName: 'Target Chain',
        name: 'targetChain',
        type: 'number',
        default: 0,
        description: 'Filter by target chain',
      },
      {
        displayName: 'Emitter Address',
        name: 'emitterAddress',
        type: 'string',
        default: '',
        description: 'Filter by emitter address',
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
  // Send message options
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['messages'],
        operation: ['sendMessage'],
      },
    },
    options: [
      {
        displayName: 'Nonce',
        name: 'nonce',
        type: 'number',
        default: 0,
        description: 'Optional nonce for the message',
      },
      {
        displayName: 'Consistency Level',
        name: 'consistencyLevel',
        type: 'number',
        default: 1,
        description: 'Finality requirement (chain specific)',
      },
    ],
  },
];

export async function executeMessages(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    let response: IDataObject;

    switch (operation) {
      case 'getMessage': {
        const emitterChain = this.getNodeParameter('emitterChain', index) as number;
        const emitterAddress = this.getNodeParameter('emitterAddress', index) as string;
        const sequence = this.getNodeParameter('sequence', index) as string;
        
        const encodedAddress = encodeAddress(emitterAddress, emitterChain);
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/messages/${emitterChain}/${encodedAddress}/${sequence}`,
        });
        break;
      }

      case 'sendMessage': {
        const sourceChain = this.getNodeParameter('sourceChain', index) as number;
        const targetChain = this.getNodeParameter('targetChain', index) as number;
        const targetAddress = this.getNodeParameter('targetAddress', index) as string;
        const payload = this.getNodeParameter('payload', index) as string;
        const senderAddress = this.getNodeParameter('senderAddress', index) as string;
        const options = this.getNodeParameter('options', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'POST',
          endpoint: '/api/v1/messages/send',
          body: {
            sourceChain,
            targetChain,
            targetAddress: encodeAddress(targetAddress, targetChain),
            payload,
            senderAddress: encodeAddress(senderAddress, sourceChain),
            ...options,
          },
        });
        break;
      }

      case 'getMessageStatus': {
        const emitterChain = this.getNodeParameter('emitterChain', index) as number;
        const emitterAddress = this.getNodeParameter('emitterAddress', index) as string;
        const sequence = this.getNodeParameter('sequence', index) as string;
        
        const vaaId = buildVaaId(emitterChain, emitterAddress, sequence);
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: `/api/v1/messages/status/${vaaId}`,
        });
        break;
      }

      case 'parseMessage': {
        const messagePayload = this.getNodeParameter('messagePayload', index) as string;
        const payloadType = this.getNodeParameter('payloadType', index) as string;
        
        response = await wormholeApiRequest.call(this, {
          method: 'POST',
          endpoint: '/api/v1/messages/parse',
          body: {
            payload: messagePayload,
            type: payloadType,
          },
        });
        break;
      }

      case 'listMessages': {
        const filters = this.getNodeParameter('filters', index, {}) as IDataObject;
        
        response = await wormholeApiRequest.call(this, {
          method: 'GET',
          endpoint: '/api/v1/messages',
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

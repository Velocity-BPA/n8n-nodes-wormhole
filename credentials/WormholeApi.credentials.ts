/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class WormholeApi implements ICredentialType {
  name = 'wormholeApi';
  displayName = 'Wormhole API';
  documentationUrl = 'https://docs.wormhole.com/';
  
  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        {
          name: 'Mainnet',
          value: 'mainnet',
        },
        {
          name: 'Testnet',
          value: 'testnet',
        },
      ],
      default: 'mainnet',
      description: 'The Wormhole network to connect to',
    },
    {
      displayName: 'Wormholescan API Endpoint',
      name: 'wormholescanApiEndpoint',
      type: 'string',
      default: 'https://api.wormholescan.io/',
      description: 'The Wormholescan API endpoint URL',
    },
    {
      displayName: 'Guardian RPC Endpoint',
      name: 'guardianRpcEndpoint',
      type: 'string',
      default: '',
      description: 'Optional Guardian RPC endpoint for direct guardian network access',
    },
    {
      displayName: 'API Key (Optional)',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Optional API key for enhanced rate limits',
    },
    {
      displayName: 'Request Timeout (ms)',
      name: 'timeout',
      type: 'number',
      default: 30000,
      description: 'Request timeout in milliseconds',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.wormholescanApiEndpoint}}',
      url: '/api/v1/health',
      method: 'GET',
    },
  };
}

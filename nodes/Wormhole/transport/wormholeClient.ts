/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  IPollFunctions,
  IDataObject,
  IHttpRequestMethods,
  IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { API_ENDPOINTS } from '../constants/chains';

export interface WormholeApiCredentials {
  network: 'mainnet' | 'testnet';
  wormholescanApiEndpoint: string;
  guardianRpcEndpoint?: string;
  apiKey?: string;
  timeout: number;
}

export interface ApiRequestOptions {
  method?: IHttpRequestMethods;
  endpoint: string;
  body?: IDataObject;
  query?: IDataObject;
  useGuardianRpc?: boolean;
}

/**
 * Get the base URL for API requests
 */
export function getBaseUrl(credentials: WormholeApiCredentials, useGuardianRpc = false): string {
  if (useGuardianRpc && credentials.guardianRpcEndpoint) {
    return credentials.guardianRpcEndpoint;
  }
  
  if (credentials.wormholescanApiEndpoint) {
    // Remove trailing slash
    return credentials.wormholescanApiEndpoint.replace(/\/$/, '');
  }
  
  // Fallback to default endpoints
  const network = credentials.network || 'mainnet';
  return API_ENDPOINTS[network].wormholescan;
}

/**
 * Make an API request to Wormhole services
 */
export async function wormholeApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
  options: ApiRequestOptions
): Promise<IDataObject> {
  const credentials = (await this.getCredentials('wormholeApi')) as unknown as WormholeApiCredentials;
  
  const baseUrl = getBaseUrl(credentials, options.useGuardianRpc);
  
  const requestOptions: IHttpRequestOptions = {
    method: options.method || 'GET',
    url: `${baseUrl}${options.endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: credentials.timeout || 30000,
    json: true,
  };
  
  // Add API key if provided
  if (credentials.apiKey) {
    requestOptions.headers = {
      ...requestOptions.headers,
      'X-API-Key': credentials.apiKey,
    };
  }
  
  // Add query parameters
  if (options.query) {
    requestOptions.qs = cleanQueryParams(options.query);
  }
  
  // Add body for POST/PUT requests
  if (options.body && ['POST', 'PUT', 'PATCH'].includes(options.method || 'GET')) {
    requestOptions.body = options.body;
  }
  
  try {
    const response = await this.helpers.httpRequest(requestOptions);
    return response as IDataObject;
  } catch (error) {
    throw handleApiError(this, error);
  }
}

/**
 * Make a paginated API request
 */
export async function wormholeApiRequestAllItems(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
  options: ApiRequestOptions,
  itemsKey: string = 'data',
  maxResults: number = 1000
): Promise<IDataObject[]> {
  const allItems: IDataObject[] = [];
  let page = 1;
  const pageSize = 50;
  
  while (allItems.length < maxResults) {
    const query = {
      ...options.query,
      page,
      pageSize,
    };
    
    const response = await wormholeApiRequest.call(this, {
      ...options,
      query,
    });
    
    const items = (response[itemsKey] as IDataObject[]) || [];
    
    if (items.length === 0) {
      break;
    }
    
    allItems.push(...items);
    
    // Check if we have more pages
    const pagination = response.pagination as IDataObject;
    if (pagination) {
      const totalPages = pagination.totalPages as number;
      if (page >= totalPages) {
        break;
      }
    } else if (items.length < pageSize) {
      break;
    }
    
    page++;
  }
  
  return allItems.slice(0, maxResults);
}

/**
 * Clean query parameters (remove undefined/null values)
 */
function cleanQueryParams(params: IDataObject): IDataObject {
  const cleaned: IDataObject = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Handle API errors
 */
function handleApiError(
  context: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
  error: unknown
): Error {
  if (error instanceof NodeApiError || error instanceof NodeOperationError) {
    return error;
  }
  
  const errorObj = error as { message?: string; statusCode?: number; response?: { data?: { message?: string; error?: string } } };
  
  let message = 'An unknown error occurred';
  let statusCode: number | undefined;
  
  if (errorObj.message) {
    message = errorObj.message;
  }
  
  if (errorObj.statusCode) {
    statusCode = errorObj.statusCode;
  }
  
  if (errorObj.response?.data?.message) {
    message = errorObj.response.data.message;
  } else if (errorObj.response?.data?.error) {
    message = errorObj.response.data.error;
  }
  
  // Map common status codes to descriptive messages
  if (statusCode === 404) {
    message = `Resource not found: ${message}`;
  } else if (statusCode === 429) {
    message = 'Rate limit exceeded. Please try again later.';
  } else if (statusCode === 401) {
    message = 'Authentication failed. Please check your API credentials.';
  } else if (statusCode === 403) {
    message = 'Access forbidden. You may not have permission for this operation.';
  } else if (statusCode && statusCode >= 500) {
    message = `Server error (${statusCode}): ${message}`;
  }
  
  return new NodeApiError(context.getNode(), { message }, {
    message,
    httpCode: statusCode?.toString(),
  });
}

/**
 * Helper to build API endpoints
 */
export function buildEndpoint(basePath: string, ...segments: (string | number)[]): string {
  const path = segments
    .filter((s) => s !== undefined && s !== null && s !== '')
    .map((s) => encodeURIComponent(String(s)))
    .join('/');
  
  return path ? `${basePath}/${path}` : basePath;
}

/**
 * Validate API response
 */
export function validateResponse(
  response: IDataObject,
  requiredFields: string[] = []
): void {
  for (const field of requiredFields) {
    if (!(field in response)) {
      throw new Error(`Invalid API response: missing required field '${field}'`);
    }
  }
}

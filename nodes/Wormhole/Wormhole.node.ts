/**
 * n8n-nodes-wormhole
 * Copyright (c) 2025 Velocity BPA
 *
 * Licensed under the Business Source License 1.1 (BSL-1.1).
 * Commercial use by for-profit organizations requires a commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// Import operations and fields
import {
	vaaOperations,
	vaaFields,
	executeVAA,
	tokenTransfersOperations,
	tokenTransfersFields,
	executeTokenTransfers,
	tokenBridgeOperations,
	tokenBridgeFields,
	executeTokenBridge,
	nttOperations,
	nttFields,
	executeNTT,
	messagesOperations,
	messagesFields,
	executeMessages,
	guardianNetworkOperations,
	guardianNetworkFields,
	executeGuardianNetwork,
	chainsOperations,
	chainsFields,
	executeChains,
	relayersOperations,
	relayersFields,
	executeRelayers,
	analyticsOperations,
	analyticsFields,
	executeAnalytics,
	transactionsOperations,
	transactionsFields,
	executeTransactions,
	governorOperations,
	governorFields,
	executeGovernor,
	queriesOperations,
	queriesFields,
	executeQueries,
	utilityOperations,
	utilityFields,
	executeUtility,
} from './actions';

// Log licensing notice once on module load
const LICENSING_LOGGED = Symbol.for('n8n-nodes-wormhole.licensing.logged');
if (!(globalThis as Record<symbol, boolean>)[LICENSING_LOGGED]) {
	console.warn(`
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
	(globalThis as Record<symbol, boolean>)[LICENSING_LOGGED] = true;
}

export class Wormhole implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wormhole',
		name: 'wormhole',
		icon: 'file:wormhole.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Wormhole cross-chain messaging and token bridge protocol',
		defaults: {
			name: 'Wormhole',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'wormholeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Analytics',
						value: 'analytics',
						description: 'Protocol statistics and metrics',
					},
					{
						name: 'Chains',
						value: 'chains',
						description: 'Chain information and configuration',
					},
					{
						name: 'Governor',
						value: 'governor',
						description: 'Rate limiting and transfer limits',
					},
					{
						name: 'Guardian Network',
						value: 'guardianNetwork',
						description: 'Guardian set and network status',
					},
					{
						name: 'Messages',
						value: 'messages',
						description: 'Cross-chain messages',
					},
					{
						name: 'Native Token Transfers (NTT)',
						value: 'ntt',
						description: 'Native Token Transfer operations',
					},
					{
						name: 'Queries (CCQ)',
						value: 'queries',
						description: 'Cross-chain queries',
					},
					{
						name: 'Relayers',
						value: 'relayers',
						description: 'Relayer services and delivery',
					},
					{
						name: 'Token Bridge (Portal)',
						value: 'tokenBridge',
						description: 'Token attestation and wrapped tokens',
					},
					{
						name: 'Token Transfers',
						value: 'tokenTransfers',
						description: 'Transfer tokens across chains',
					},
					{
						name: 'Transactions',
						value: 'transactions',
						description: 'Transaction history and search',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Address encoding and validation',
					},
					{
						name: 'VAAs',
						value: 'vaa',
						description: 'Verifiable Action Approvals',
					},
				],
				default: 'vaa',
			},
			// VAA operations
			...vaaOperations,
			...vaaFields,
			// Token Transfers operations
			...tokenTransfersOperations,
			...tokenTransfersFields,
			// Token Bridge operations
			...tokenBridgeOperations,
			...tokenBridgeFields,
			// NTT operations
			...nttOperations,
			...nttFields,
			// Messages operations
			...messagesOperations,
			...messagesFields,
			// Guardian Network operations
			...guardianNetworkOperations,
			...guardianNetworkFields,
			// Chains operations
			...chainsOperations,
			...chainsFields,
			// Relayers operations
			...relayersOperations,
			...relayersFields,
			// Analytics operations
			...analyticsOperations,
			...analyticsFields,
			// Transactions operations
			...transactionsOperations,
			...transactionsFields,
			// Governor operations
			...governorOperations,
			...governorFields,
			// Queries operations
			...queriesOperations,
			...queriesFields,
			// Utility operations
			...utilityOperations,
			...utilityFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				let result: INodeExecutionData[];

				switch (resource) {
					case 'vaa':
						result = await executeVAA.call(this, i);
						break;
					case 'tokenTransfers':
						result = await executeTokenTransfers.call(this, i);
						break;
					case 'tokenBridge':
						result = await executeTokenBridge.call(this, i);
						break;
					case 'ntt':
						result = await executeNTT.call(this, i);
						break;
					case 'messages':
						result = await executeMessages.call(this, i);
						break;
					case 'guardianNetwork':
						result = await executeGuardianNetwork.call(this, i);
						break;
					case 'chains':
						result = await executeChains.call(this, i);
						break;
					case 'relayers':
						result = await executeRelayers.call(this, i);
						break;
					case 'analytics':
						result = await executeAnalytics.call(this, i);
						break;
					case 'transactions':
						result = await executeTransactions.call(this, i);
						break;
					case 'governor':
						result = await executeGovernor.call(this, i);
						break;
					case 'queries':
						result = await executeQueries.call(this, i);
						break;
					case 'utility':
						result = await executeUtility.call(this, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

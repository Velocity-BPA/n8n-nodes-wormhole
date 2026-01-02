/**
 * n8n-nodes-wormhole
 * Copyright (c) 2025 Velocity BPA
 *
 * Licensed under the Business Source License 1.1 (BSL-1.1).
 * Commercial use by for-profit organizations requires a commercial license.
 * See LICENSE file for details.
 */

import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	INodeExecutionData,
} from 'n8n-workflow';
import { wormholeApiRequest } from './transport/wormholeClient';
import { getChainOptions } from './utils/chainUtils';
import { formatTimestamp } from './utils/helpers';

export class WormholeTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wormhole Trigger',
		name: 'wormholeTrigger',
		icon: 'file:wormhole.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["triggerType"]}}',
		description: 'Triggers when Wormhole events occur',
		defaults: {
			name: 'Wormhole Trigger',
		},
		polling: true,
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'wormholeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'options',
				options: [
					{
						name: 'Chain Added',
						value: 'chainAdded',
						description: 'Trigger when a new chain is connected',
					},
					{
						name: 'Guardian Set Changed',
						value: 'guardianSetChanged',
						description: 'Trigger when guardian rotation occurs',
					},
					{
						name: 'Large Transfer Alert',
						value: 'largeTransferAlert',
						description: 'Trigger for transfers above threshold',
					},
					{
						name: 'Message Delivered',
						value: 'messageDelivered',
						description: 'Trigger when cross-chain message is delivered',
					},
					{
						name: 'New Token Attested',
						value: 'newTokenAttested',
						description: 'Trigger when new token is registered',
					},
					{
						name: 'Transfer Completed',
						value: 'transferCompleted',
						description: 'Trigger when token transfer completes',
					},
					{
						name: 'VAA Published',
						value: 'vaaPublished',
						description: 'Trigger when new VAA is published',
					},
				],
				default: 'vaaPublished',
				required: true,
			},

			// VAA Published filters
			{
				displayName: 'Source Chain',
				name: 'sourceChain',
				type: 'options',
				options: getChainOptions(),
				default: '',
				description: 'Filter by source chain',
				displayOptions: {
					show: {
						triggerType: ['vaaPublished', 'transferCompleted', 'messageDelivered'],
					},
				},
			},
			{
				displayName: 'Emitter Address',
				name: 'emitterAddress',
				type: 'string',
				default: '',
				description: 'Filter by emitter contract address',
				displayOptions: {
					show: {
						triggerType: ['vaaPublished'],
					},
				},
			},

			// Transfer filters
			{
				displayName: 'Target Chain',
				name: 'targetChain',
				type: 'options',
				options: getChainOptions(),
				default: '',
				description: 'Filter by target chain',
				displayOptions: {
					show: {
						triggerType: ['transferCompleted', 'messageDelivered', 'largeTransferAlert'],
					},
				},
			},
			{
				displayName: 'Token Address',
				name: 'tokenAddress',
				type: 'string',
				default: '',
				description: 'Filter by token address',
				displayOptions: {
					show: {
						triggerType: ['transferCompleted', 'largeTransferAlert', 'newTokenAttested'],
					},
				},
			},

			// Large transfer threshold
			{
				displayName: 'Threshold Amount (USD)',
				name: 'thresholdAmount',
				type: 'number',
				default: 100000,
				description: 'Minimum transfer amount in USD to trigger',
				displayOptions: {
					show: {
						triggerType: ['largeTransferAlert'],
					},
				},
			},

			// Chain filter for attestations
			{
				displayName: 'Chain',
				name: 'chain',
				type: 'options',
				options: getChainOptions(),
				default: '',
				description: 'Filter by chain',
				displayOptions: {
					show: {
						triggerType: ['newTokenAttested', 'chainAdded'],
					},
				},
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const triggerType = this.getNodeParameter('triggerType') as string;
		const webhookData = this.getWorkflowStaticData('node');

		let responseData: IDataObject[] = [];

		try {
			switch (triggerType) {
				case 'vaaPublished': {
					const sourceChain = this.getNodeParameter('sourceChain', '') as string;
					const emitterAddress = this.getNodeParameter('emitterAddress', '') as string;

					const queryParams: IDataObject = {
						pageSize: '20',
					};
					if (sourceChain) queryParams.chain = sourceChain;
					if (emitterAddress) queryParams.emitter = emitterAddress;

					const lastSequence = webhookData.lastSequence as string | undefined;
					if (lastSequence) {
						queryParams.afterSequence = lastSequence;
					}

					const response = await wormholeApiRequest.call(this, {
						method: 'GET',
						endpoint: '/api/v1/vaas',
						query: queryParams,
					});

					const vaas = ((response as IDataObject).vaas as IDataObject[]) || [];

					if (vaas.length > 0) {
						// Update last sequence
						const latestVaa = vaas[0];
						webhookData.lastSequence = latestVaa.sequence as string;

						responseData = vaas.map(vaa => ({
							...vaa,
							timestamp: vaa.timestamp ? formatTimestamp(String(vaa.timestamp)) : undefined,
							eventType: 'vaaPublished',
						}));
					}
					break;
				}

				case 'transferCompleted': {
					const sourceChain = this.getNodeParameter('sourceChain', '') as string;
					const targetChain = this.getNodeParameter('targetChain', '') as string;
					const tokenAddress = this.getNodeParameter('tokenAddress', '') as string;

					const queryParams: IDataObject = {
						pageSize: '20',
						status: 'completed',
					};
					if (sourceChain) queryParams.sourceChain = sourceChain;
					if (targetChain) queryParams.targetChain = targetChain;
					if (tokenAddress) queryParams.tokenAddress = tokenAddress;

					const lastTimestamp = webhookData.lastTransferTimestamp as string | undefined;
					if (lastTimestamp) {
						queryParams.fromTime = lastTimestamp;
					}

					const response = await wormholeApiRequest.call(this, {
						method: 'GET',
						endpoint: '/api/v1/transfers',
						query: queryParams,
					});

					const transfers = ((response as IDataObject).transfers as IDataObject[]) || [];

					if (transfers.length > 0) {
						// Filter out already seen transfers
						const newTransfers = lastTimestamp
							? transfers.filter(t => new Date(t.completedAt as string) > new Date(lastTimestamp))
							: transfers;

						if (newTransfers.length > 0) {
							// Update last timestamp
							const latestTransfer = newTransfers[0];
							webhookData.lastTransferTimestamp = latestTransfer.completedAt as string;

							responseData = newTransfers.map(transfer => ({
								...transfer,
								timestamp: transfer.timestamp ? formatTimestamp(String(transfer.timestamp)) : undefined,
								completedAt: transfer.completedAt ? formatTimestamp(String(transfer.completedAt)) : undefined,
								eventType: 'transferCompleted',
							}));
						}
					}
					break;
				}

				case 'largeTransferAlert': {
					const targetChain = this.getNodeParameter('targetChain', '') as string;
					const tokenAddress = this.getNodeParameter('tokenAddress', '') as string;
					const thresholdAmount = this.getNodeParameter('thresholdAmount', 100000) as number;

					const queryParams: IDataObject = {
						pageSize: '20',
						minAmount: thresholdAmount.toString(),
					};
					if (targetChain) queryParams.targetChain = targetChain;
					if (tokenAddress) queryParams.tokenAddress = tokenAddress;

					const lastAlertId = webhookData.lastLargeTransferId as string | undefined;

					const response = await wormholeApiRequest.call(this, {
						method: 'GET',
						endpoint: '/api/v1/transfers',
						query: queryParams,
					});

					const transfers = ((response as IDataObject).transfers as IDataObject[]) || [];

					if (transfers.length > 0) {
						// Filter out already seen transfers
						const newTransfers = lastAlertId
							? transfers.filter(t => t.id !== lastAlertId)
							: transfers;

						if (newTransfers.length > 0) {
							webhookData.lastLargeTransferId = newTransfers[0].id as string;

							responseData = newTransfers.map(transfer => ({
								...transfer,
								timestamp: transfer.timestamp ? formatTimestamp(String(transfer.timestamp)) : undefined,
								thresholdAmount,
								eventType: 'largeTransferAlert',
							}));
						}
					}
					break;
				}

				case 'messageDelivered': {
					const sourceChain = this.getNodeParameter('sourceChain', '') as string;
					const targetChain = this.getNodeParameter('targetChain', '') as string;

					const queryParams: IDataObject = {
						pageSize: '20',
						status: 'delivered',
					};
					if (sourceChain) queryParams.sourceChain = sourceChain;
					if (targetChain) queryParams.targetChain = targetChain;

					const lastMessageId = webhookData.lastMessageId as string | undefined;

					const response = await wormholeApiRequest.call(this, {
						method: 'GET',
						endpoint: '/api/v1/messages',
						query: queryParams,
					});

					const messages = ((response as IDataObject).messages as IDataObject[]) || [];

					if (messages.length > 0) {
						const newMessages = lastMessageId
							? messages.filter(m => m.id !== lastMessageId)
							: messages;

						if (newMessages.length > 0) {
							webhookData.lastMessageId = newMessages[0].id as string;

							responseData = newMessages.map(message => ({
								...message,
								timestamp: message.timestamp ? formatTimestamp(String(message.timestamp)) : undefined,
								deliveredAt: message.deliveredAt ? formatTimestamp(String(message.deliveredAt)) : undefined,
								eventType: 'messageDelivered',
							}));
						}
					}
					break;
				}

				case 'newTokenAttested': {
					const chain = this.getNodeParameter('chain', '') as string;
					const tokenAddress = this.getNodeParameter('tokenAddress', '') as string;

					const queryParams: IDataObject = {
						pageSize: '20',
					};
					if (chain) queryParams.chain = chain;
					if (tokenAddress) queryParams.tokenAddress = tokenAddress;

					const lastAttestationId = webhookData.lastAttestationId as string | undefined;

					const response = await wormholeApiRequest.call(this, {
						method: 'GET',
						endpoint: '/api/v1/token-bridge/attestations',
						query: queryParams,
					});

					const attestations = ((response as IDataObject).attestations as IDataObject[]) || [];

					if (attestations.length > 0) {
						const newAttestations = lastAttestationId
							? attestations.filter(a => a.id !== lastAttestationId)
							: attestations;

						if (newAttestations.length > 0) {
							webhookData.lastAttestationId = newAttestations[0].id as string;

							responseData = newAttestations.map(attestation => ({
								...attestation,
								timestamp: attestation.timestamp ? formatTimestamp(String(attestation.timestamp)) : undefined,
								eventType: 'newTokenAttested',
							}));
						}
					}
					break;
				}

				case 'guardianSetChanged': {
					const response = await wormholeApiRequest.call(this, {
						method: 'GET',
						endpoint: '/api/v1/guardians/set',
					});

					const guardianSet = response as IDataObject;
					const currentIndex = guardianSet.index as number;
					const lastGuardianIndex = webhookData.lastGuardianIndex as number | undefined;

					if (lastGuardianIndex !== undefined && currentIndex !== lastGuardianIndex) {
						webhookData.lastGuardianIndex = currentIndex;

						responseData = [{
							...guardianSet,
							previousIndex: lastGuardianIndex,
							newIndex: currentIndex,
							eventType: 'guardianSetChanged',
						}];
					} else if (lastGuardianIndex === undefined) {
						// First poll - just store the current index
						webhookData.lastGuardianIndex = currentIndex;
					}
					break;
				}

				case 'chainAdded': {
					const chainFilter = this.getNodeParameter('chain', '') as string;

					const response = await wormholeApiRequest.call(this, {
						method: 'GET',
						endpoint: '/api/v1/chains',
					});

					const chains = ((response as IDataObject).chains as IDataObject[]) || [];
					const filteredChains = chainFilter
						? chains.filter(c => c.id === parseInt(chainFilter, 10))
						: chains;

					const currentChainIds = filteredChains.map(c => c.id as number);
					const lastChainIds = (webhookData.lastChainIds as number[]) || [];

					const newChains = filteredChains.filter(
						c => !lastChainIds.includes(c.id as number)
					);

					if (newChains.length > 0 && lastChainIds.length > 0) {
						webhookData.lastChainIds = currentChainIds;

						responseData = newChains.map(chain => ({
							...chain,
							eventType: 'chainAdded',
						}));
					} else if (lastChainIds.length === 0) {
						// First poll - just store current chain IDs
						webhookData.lastChainIds = currentChainIds;
					}
					break;
				}
			}

			if (responseData.length === 0) {
				return null;
			}

			return [responseData.map(item => ({ json: item }))];
		} catch (error) {
			// Log error but don't fail - will retry on next poll
			console.error(`Wormhole Trigger error: ${(error as Error).message}`);
			return null;
		}
	}
}

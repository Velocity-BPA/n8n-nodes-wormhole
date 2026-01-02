/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * VAA (Verifiable Action Approval) types
 */
export interface VAA {
  id: string;
  version: number;
  emitterChain: number;
  emitterAddress: string;
  sequence: string;
  guardianSetIndex: number;
  vaa: string;
  timestamp: string;
  updatedAt: string;
  indexedAt: string;
  txHash?: string;
  payload?: VAAPayload;
  signatures?: VAASignature[];
}

export interface VAAPayload {
  type: string;
  amount?: string;
  tokenAddress?: string;
  tokenChain?: number;
  to?: string;
  toChain?: number;
  fee?: string;
  fromAddress?: string;
  payload?: string;
}

export interface VAASignature {
  index: number;
  signature: string;
}

export interface VAASearchParams {
  emitterChain?: number;
  emitterAddress?: string;
  sequence?: string;
  txHash?: string;
  page?: number;
  pageSize?: number;
  sortOrder?: 'ASC' | 'DESC';
}

export interface VAASearchResponse {
  vaas: VAA[];
  pagination: PaginationInfo;
}

/**
 * Token Transfer types
 */
export interface TokenTransfer {
  id: string;
  emitterChain: number;
  emitterAddress: string;
  sequence: string;
  vaa?: string;
  sourceChain: number;
  targetChain: number;
  tokenAddress: string;
  tokenChain: number;
  amount: string;
  usdAmount?: string;
  fromAddress: string;
  toAddress: string;
  sourceTxHash: string;
  targetTxHash?: string;
  status: string;
  timestamp: string;
}

export interface TransferQuote {
  sourceChain: number;
  targetChain: number;
  tokenAddress: string;
  amount: string;
  estimatedFee: string;
  estimatedTime: number;
  relayerFee?: string;
  bridgeFee?: string;
}

export interface TransferRequest {
  sourceChain: number;
  targetChain: number;
  tokenAddress: string;
  amount: string;
  recipientAddress: string;
  senderAddress: string;
}

export interface TransferTransaction {
  txData: string;
  estimatedGas?: string;
  instructions?: string[];
}

/**
 * Token Bridge (Portal) types
 */
export interface AttestationRequest {
  tokenAddress: string;
  tokenChain: number;
}

export interface AttestationStatus {
  tokenAddress: string;
  tokenChain: number;
  isAttested: boolean;
  attestedAt?: string;
  wrappedTokens?: WrappedToken[];
}

export interface WrappedToken {
  chainId: number;
  address: string;
  symbol?: string;
  decimals?: number;
}

export interface SupportedToken {
  address: string;
  chainId: number;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
  nativeChain: number;
}

/**
 * Native Token Transfers (NTT) types
 */
export interface NTTQuote {
  sourceChain: number;
  targetChain: number;
  tokenAddress: string;
  amount: string;
  fee: string;
  estimatedTime: number;
  isSupported: boolean;
}

export interface NTTTransfer {
  id: string;
  sourceChain: number;
  targetChain: number;
  tokenAddress: string;
  amount: string;
  sender: string;
  recipient: string;
  status: string;
  sourceTxHash: string;
  targetTxHash?: string;
  timestamp: string;
}

export interface NTTToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  supportedChains: number[];
}

/**
 * Message types
 */
export interface CrossChainMessage {
  id: string;
  emitterChain: number;
  emitterAddress: string;
  sequence: string;
  payload: string;
  payloadDecoded?: Record<string, unknown>;
  nonce: number;
  timestamp: string;
  targetChain?: number;
  targetAddress?: string;
  delivered?: boolean;
  deliveredAt?: string;
}

export interface MessageSearchParams {
  emitterChain?: number;
  emitterAddress?: string;
  targetChain?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Guardian Network types
 */
export interface Guardian {
  index: number;
  name: string;
  address: string;
  pubkey: string;
}

export interface GuardianSet {
  index: number;
  keys: string[];
  guardians: Guardian[];
  expirationTime?: number;
}

export interface GuardianHeartbeat {
  guardianAddr: string;
  nodeName: string;
  timestamp: string;
  version: string;
  counter: number;
  networks: NetworkHeartbeat[];
}

export interface NetworkHeartbeat {
  id: number;
  height: string;
  contractAddress: string;
  errorCount: number;
}

export interface NetworkStatus {
  guardianSetIndex: number;
  guardians: number;
  quorum: number;
  health: string;
  networks: ChainNetworkStatus[];
}

export interface ChainNetworkStatus {
  chainId: number;
  chainName: string;
  height: string;
  healthy: boolean;
  errorCount: number;
}

/**
 * Chain types
 */
export interface ChainInfo {
  chainId: number;
  name: string;
  displayName: string;
  network: string;
  finality: number;
  coreContract: string;
  tokenBridgeContract?: string;
  nftBridgeContract?: string;
  relayerContract?: string;
  isEvm: boolean;
  explorerUrl?: string;
}

export interface ChainStats {
  chainId: number;
  chainName: string;
  totalMessages: number;
  totalVolume: string;
  totalVolumeUsd: string;
  last24hMessages: number;
  last24hVolume: string;
  last24hVolumeUsd: string;
}

/**
 * Relayer types
 */
export interface RelayerStatus {
  relayerId: string;
  name: string;
  health: string;
  supportedChains: number[];
  lastHeartbeat: string;
}

export interface DeliveryQuote {
  relayerId: string;
  sourceChain: number;
  targetChain: number;
  fee: string;
  feeToken: string;
  estimatedDeliveryTime: number;
}

export interface DeliveryRequest {
  vaaId: string;
  targetChain: number;
  relayerId?: string;
  maxFee?: string;
}

export interface DeliveryStatus {
  deliveryId: string;
  vaaId: string;
  status: string;
  sourceChain: number;
  targetChain: number;
  sourceTxHash: string;
  targetTxHash?: string;
  relayerId: string;
  fee: string;
  timestamp: string;
  completedAt?: string;
}

/**
 * Analytics types
 */
export interface ProtocolStats {
  totalMessages: number;
  totalVolume: string;
  totalVolumeUsd: string;
  totalTransfers: number;
  uniqueAddresses: number;
  connectedChains: number;
  tvl: string;
  tvlUsd: string;
}

export interface VolumeByChain {
  chainId: number;
  chainName: string;
  volume: string;
  volumeUsd: string;
  percentage: number;
}

export interface TopToken {
  tokenAddress: string;
  tokenChain: number;
  symbol: string;
  name: string;
  volume: string;
  volumeUsd: string;
  transferCount: number;
}

export interface HistoricalVolume {
  timestamp: string;
  volume: string;
  volumeUsd: string;
  transferCount: number;
}

export interface ActivityMetrics {
  period: string;
  transactions: number;
  uniqueUsers: number;
  volume: string;
  volumeUsd: string;
}

/**
 * Transaction types
 */
export interface Transaction {
  id: string;
  txHash: string;
  chainId: number;
  emitterAddress: string;
  sequence: string;
  vaaId?: string;
  type: string;
  status: string;
  timestamp: string;
  blockNumber: number;
  from: string;
  to?: string;
  value?: string;
  fee?: string;
}

export interface TransactionSearchParams {
  chainId?: number;
  address?: string;
  type?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Governor types
 */
export interface GovernorStatus {
  chainId: number;
  chainName: string;
  availableNotional: string;
  maxDailyNotional: string;
  currentDailyNotional: string;
  enqueuedVaas: number;
}

export interface EnqueuedVAA {
  vaaId: string;
  emitterChain: number;
  emitterAddress: string;
  sequence: string;
  releaseTime: string;
  notionalValue: string;
  txHash: string;
}

export interface GovernorConfig {
  chainId: number;
  notionalLimit: string;
  bigTransactionSize: string;
  dailyLimit: string;
}

/**
 * Cross-Chain Queries (CCQ) types
 */
export interface QueryRequest {
  targetChain: number;
  targetContract: string;
  callData: string;
  blockTag?: string;
}

export interface QueryResult {
  queryId: string;
  status: string;
  targetChain: number;
  targetContract: string;
  result?: string;
  blockNumber?: string;
  timestamp?: string;
  error?: string;
}

export interface SupportedQuery {
  type: string;
  description: string;
  supportedChains: number[];
}

/**
 * Utility types
 */
export interface EncodedAddress {
  address: string;
  format: string;
  chainId: number;
}

export interface DecodedAddress {
  original: string;
  hex: string;
  chainId: number;
  isValid: boolean;
}

export interface APIHealthStatus {
  status: string;
  version: string;
  timestamp: string;
  services: ServiceHealth[];
}

export interface ServiceHealth {
  name: string;
  status: string;
  latency?: number;
}

/**
 * Pagination types
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Error types
 */
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Trigger event types
 */
export interface TriggerEvent {
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface VAAPublishedEvent extends TriggerEvent {
  type: 'vaaPublished';
  data: {
    vaa: VAA;
    emitterChain: number;
    emitterAddress: string;
    sequence: string;
  };
}

export interface TransferCompletedEvent extends TriggerEvent {
  type: 'transferCompleted';
  data: {
    transfer: TokenTransfer;
    sourceChain: number;
    targetChain: number;
    amount: string;
  };
}

export interface LargeTransferEvent extends TriggerEvent {
  type: 'largeTransferAlert';
  data: {
    transfer: TokenTransfer;
    threshold: string;
    usdValue: string;
  };
}

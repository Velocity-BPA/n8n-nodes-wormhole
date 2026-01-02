# n8n-nodes-wormhole

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Wormhole, the cross-chain messaging and token bridge protocol connecting 30+ blockchains including Ethereum, Solana, BSC, Polygon, Avalanche, Arbitrum, Optimism, Aptos, and Sui.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![Wormhole](https://img.shields.io/badge/Wormhole-cross--chain-00D4AA)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## Features

- **13 Resource Categories** with 80+ operations
- **VAA Management** - Retrieve, parse, and validate Verifiable Action Approvals
- **Token Bridging** - Portal token bridge operations with lock/mint mechanism
- **Native Token Transfers (NTT)** - Burn/mint model transfers
- **Guardian Network** - Monitor the 19-node validator network
- **Cross-Chain Queries (CCQ)** - Read state across chains
- **Multi-Chain Support** - 30+ blockchains including EVM and non-EVM
- **Analytics & Monitoring** - Protocol stats, volume, TVL, and transaction metrics
- **Poll-Based Triggers** - 7 event types for workflow automation

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-wormhole`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-wormhole

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-wormhole.git
cd n8n-nodes-wormhole

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-wormhole

# Restart n8n
```

## Credentials Setup

### Wormhole API Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Network | Mainnet or Testnet | Yes |
| Wormholescan API URL | API endpoint (default: https://api.wormholescan.io/) | Yes |
| Guardian RPC Endpoint | Optional Guardian RPC URL | No |
| API Key | Optional API key for enhanced rate limits | No |
| Request Timeout | Request timeout in milliseconds | No |

## Resources & Operations

### VAAs (Verifiable Action Approvals)
- `getVAAByID` - Lookup VAA by emitter chain, address, and sequence
- `getVAAByTransaction` - Find VAA by source transaction hash
- `searchVAAs` - Query VAAs with filters
- `getVAAStatus` - Get verification status
- `parseVAA` - Decode VAA payload and signatures
- `getRecentVAAs` - Get latest VAAs with pagination

### Token Transfers
- `getTransferQuote` - Estimate transfer cost and time
- `buildTransfer` - Create transfer transaction data
- `getTransferStatus` - Track transfer progress
- `completeTransfer` - Build redemption transaction
- `getTransferByHash` - Lookup transfer details
- `listTransfers` - Get transfer history by address

### Token Bridge (Portal)
- `attestToken` - Register token for cross-chain transfers
- `getAttestation` - Get token registration status
- `getWrappedToken` - Find wrapped token on destination
- `getOriginalToken` - Find native token from wrapped
- `getSupportedTokens` - List bridgeable tokens

### Native Token Transfers (NTT)
- `getNTTQuote` - Get NTT transfer estimate
- `sendNTT` - Initiate NTT transfer
- `redeemNTT` - Complete NTT on destination
- `getNTTStatus` - Track NTT transfer
- `getNTTTokens` - List NTT-supported tokens

### Messages
- `getMessage` - Retrieve cross-chain message
- `sendMessage` - Post message (build transaction)
- `getMessageStatus` - Check delivery status
- `parseMessage` - Decode message payload
- `listMessages` - Get recent messages

### Guardian Network
- `getGuardianSet` - Get current guardian set
- `getGuardianInfo` - Get individual guardian details
- `getHeartbeats` - Get guardian health status
- `getNetworkStatus` - Get overall network status
- `getSignatures` - Get VAA signatures breakdown

### Chains
- `getSupportedChains` - Get all connected chains
- `getChainInfo` - Get chain details
- `getChainStats` - Get chain metrics
- `getEmitterAddress` - Get core bridge address
- `getContractAddresses` - Get Wormhole contracts

### Relayers
- `getRelayerStatus` - Get relayer health
- `getDeliveryQuote` - Get relayer fee estimate
- `requestDelivery` - Request relayer delivery
- `trackDelivery` - Track delivery status
- `getRelayerProviders` - List available relayers

### Analytics
- `getProtocolStats` - Get overall protocol metrics
- `getVolumeByChain` - Get volume breakdown
- `getTopTokens` - Get most bridged tokens
- `getHistoricalVolume` - Get time-series data
- `getTransactionCount` - Get activity metrics
- `getTVL` - Get total value locked

### Transactions
- `getTransaction` - Get transaction details
- `searchTransactions` - Query with filters
- `getRecentTransactions` - Get latest activity
- `getTransactionsByAddress` - Get user history
- `getTransactionStatus` - Get completion status

### Governor
- `getGovernorStatus` - Get governor info
- `getAvailableNotional` - Get transfer limits
- `getEnqueuedVAAs` - Get pending large transfers
- `getGovernorConfig` - Get limit configuration

### Queries (CCQ)
- `createQuery` - Create cross-chain query
- `getQueryResult` - Get query response
- `getSupportedQueries` - List query types

### Utility
- `encodeAddress` - Format address for chain
- `decodeAddress` - Parse chain-specific address
- `getChainID` - Get Wormhole chain ID
- `validateVAA` - Verify VAA signatures
- `getAPIHealth` - Check service status

## Trigger Node

The Wormhole Trigger node supports poll-based event monitoring:

| Trigger | Description |
|---------|-------------|
| VAA Published | New VAA published (filter by chain, emitter) |
| Transfer Completed | Token transfer completed |
| Large Transfer Alert | Transfer above threshold |
| Message Delivered | Cross-chain message delivered |
| New Token Attested | New token registered |
| Guardian Set Changed | Guardian rotation |
| Chain Added | New chain connected |

## Usage Examples

### Monitor Large Transfers

```javascript
// Wormhole Trigger: largeTransferAlert
// Threshold: 100000 (USD)
// -> Slack: Send notification
// -> Airtable: Log transfer details
```

### Track Cross-Chain Message

```javascript
// Wormhole: getMessage
// Chain: 2 (Ethereum)
// Emitter: 0x...
// Sequence: 12345
```

### Get Transfer Quote

```javascript
// Wormhole: getTransferQuote
// Source Chain: Ethereum
// Target Chain: Solana
// Token: USDC
// Amount: 1000
```

## Wormhole Concepts

| Concept | Description |
|---------|-------------|
| VAA | Verifiable Action Approval - signed cross-chain proof from Guardians |
| Guardian | Validator in the 19-node Guardian Network |
| Emitter | Contract that publishes messages to Wormhole |
| Sequence | Auto-incrementing message number per emitter |
| Attestation | Token registration for cross-chain transfers |
| Portal | Token bridge using lock/mint mechanism |
| NTT | Native Token Transfers - burn/mint model |
| Relayer | Entity that delivers VAAs to destination chain |
| Governor | Rate limiting system for large transfers |
| CCQ | Cross-Chain Queries for reading state |

## Supported Networks

| Network | Chain ID | Type |
|---------|----------|------|
| Solana | 1 | Non-EVM |
| Ethereum | 2 | EVM |
| Terra | 3 | Non-EVM |
| BSC | 4 | EVM |
| Polygon | 5 | EVM |
| Avalanche | 6 | EVM |
| Oasis | 7 | Non-EVM |
| Algorand | 8 | Non-EVM |
| Aurora | 9 | EVM |
| Fantom | 10 | EVM |
| Karura | 11 | Non-EVM |
| Acala | 12 | Non-EVM |
| Klaytn | 13 | EVM |
| Celo | 14 | EVM |
| NEAR | 15 | Non-EVM |
| Moonbeam | 16 | EVM |
| Neon | 17 | EVM |
| Terra2 | 18 | Non-EVM |
| Injective | 19 | Non-EVM |
| Osmosis | 20 | Non-EVM |
| Sui | 21 | Non-EVM |
| Aptos | 22 | Non-EVM |
| Arbitrum | 23 | EVM |
| Optimism | 24 | EVM |
| Base | 30 | EVM |

## Error Handling

All operations include built-in error handling:
- Network timeouts with configurable duration
- Rate limiting with automatic retry
- Detailed error messages with API status codes
- Continue on fail option for batch processing

## Security Best Practices

1. **API Keys** - Use API keys when available for enhanced rate limits
2. **Network Selection** - Use testnet for development and testing
3. **Rate Limiting** - Implement appropriate delays between operations
4. **VAA Validation** - Always validate VAAs before processing
5. **Address Verification** - Verify addresses match expected formats

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npm run typecheck
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Support

- **Documentation**: [Wormhole Docs](https://docs.wormhole.com/)
- **API Reference**: [Wormholescan API](https://docs.wormholescan.io/)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-wormhole/issues)

## Acknowledgments

- [Wormhole Foundation](https://wormhole.com/) for the cross-chain protocol
- [n8n](https://n8n.io/) for the workflow automation platform
- [Wormholescan](https://wormholescan.io/) for the API infrastructure

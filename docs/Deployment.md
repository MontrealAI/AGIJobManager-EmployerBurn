# Deployment guide (Legacy Truffle compatibility)

> **Canonical production deployment path is Hardhat, not Truffle.**
> Use `hardhat/README.md` and `docs/DEPLOYMENT/README.md` for mainnet release operations.

This document is retained only for historical reproducibility and compatibility with existing Truffle-based environments.

## Canonical vs legacy summary

- **Canonical production deploy/verify/release:** Hardhat wrappers from repo root (`npm run doctor`, `npm run release:build`, `npm run release:deploy:mainnet`, `npm run release:verify`, `npm run release:postdeploy`, `npm run release:readiness`).
- **Legacy compatibility path:** Truffle scripts and migrations in this document.
- **Production artifact source of truth:** `hardhat/artifacts/**`.

## Legacy prerequisites
- Node.js and npm (CI uses Node 20).
- Truffle installed via repository dependencies.
- RPC access for Sepolia/Mainnet (or a local Ganache instance).

## Legacy environment variables

The legacy Truffle configuration supports both direct RPC URLs and provider keys. `PRIVATE_KEYS` is required for Sepolia/Mainnet Truffle deployments.

| Variable | Purpose | Notes |
| --- | --- | --- |
| `PRIVATE_KEYS` | Deployer keys | Comma‑separated, no spaces. Required for Sepolia/Mainnet deployments. |
| `SEPOLIA_RPC_URL` | Sepolia RPC URL | Optional if using Alchemy or Infura. |
| `MAINNET_RPC_URL` | Mainnet RPC URL | Optional if using Alchemy or Infura. |
| `ALCHEMY_KEY` | Alchemy key for Sepolia | Used if `SEPOLIA_RPC_URL` is empty. |
| `ALCHEMY_KEY_MAIN` | Alchemy key for Mainnet | Falls back to `ALCHEMY_KEY` if empty. |
| `INFURA_KEY` | Infura key | Used if no direct RPC URL or Alchemy key. |
| `ETHERSCAN_API_KEY` | Verification key | Used by `truffle-plugin-verify`. |
| `SEPOLIA_GAS` / `MAINNET_GAS` | Gas limit override | Defaults to 8,000,000. |
| `SEPOLIA_GAS_PRICE_GWEI` / `MAINNET_GAS_PRICE_GWEI` | Gas price override | In Gwei. |
| `SEPOLIA_CONFIRMATIONS` / `MAINNET_CONFIRMATIONS` | Confirmations to wait | Defaults to 2. |
| `SEPOLIA_TIMEOUT_BLOCKS` / `MAINNET_TIMEOUT_BLOCKS` | Timeout blocks | Defaults to 500. |
| `RPC_POLLING_INTERVAL_MS` | Provider polling interval | Defaults to 8000 ms. |
| `SOLC_EVM_VERSION` | EVM version override | Defaults to `london` when unset. |
| Compiler settings | Compiler settings | Pinned in `truffle-config.js` (solc `0.8.23`, runs `50`, `evmVersion` `london`). |
| `GANACHE_MNEMONIC` | Local test mnemonic | Defaults to Ganache standard mnemonic if unset. |

A template lives in [`.env.example`](../.env.example).

## Runtime bytecode limits (reference)

Ethereum mainnet hard limits:
- Runtime bytecode: 24,576 bytes (EIP-170).
- Initcode: 49,152 bytes (EIP-3860).

Use canonical size gate from repo root:

```bash
npm run size
```

## Legacy Truffle network notes
- `test`: in‑process Ganache provider for `truffle test`.
- `development`: local RPC at `127.0.0.1:8545`.
- `sepolia`: remote deployment via RPC (HDWalletProvider).
- `mainnet`: remote deployment via RPC (HDWalletProvider).

Canonical test command from repo root is now `npm test` (`npm run test:canonical`), which executes the Hardhat-first release-readiness gate.

## Legacy migration notes

The migration scripts in `migrations/` remain for compatibility. For production releases, use Hardhat scripts in `hardhat/scripts/` and root `release:*` wrappers.

## Legacy local deployment (Ganache)

```bash
npx ganache -p 8545
npm run build:legacy
npx truffle migrate --network development
```

## Legacy Sepolia deployment

```bash
npm run build:legacy
npx truffle migrate --network sepolia
```

## Legacy Mainnet deployment

```bash
npm run build:legacy
npx truffle migrate --network mainnet
```

## Legacy Truffle verification (if explicitly needed)

```bash
npx truffle run verify AGIJobManager --network sepolia
npx truffle run verify AGIJobManager --network mainnet
```

For production verification workflow, use `npm run release:verify` (Hardhat canonical).

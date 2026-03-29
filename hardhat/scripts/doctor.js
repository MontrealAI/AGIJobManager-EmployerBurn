const fs = require('fs');
const path = require('path');
const { ethers, network } = require('hardhat');

const REQUIRED_ENV = ['PRIVATE_KEY', 'ETHERSCAN_API_KEY'];
const NETWORK_RPC_ENV = {
  mainnet: 'MAINNET_RPC_URL',
  sepolia: 'SEPOLIA_RPC_URL',
};

function mask(value) {
  if (!value) return '<missing>';
  if (value.length <= 10) return '***';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

async function main() {
  const root = path.resolve(__dirname, '..', '..');
  const deployConfigPath = process.env.DEPLOY_CONFIG
    ? path.resolve(root, process.env.DEPLOY_CONFIG)
    : path.resolve(__dirname, '..', 'deploy.config.example.js');

  let failed = false;

  console.log('=== Hardhat Doctor (EmployerBurn Canonical Release Path) ===');
  console.log(`network=${network.name}`);

  for (const key of REQUIRED_ENV) {
    const value = (process.env[key] || '').trim();
    if (!value) {
      console.error(`❌ Missing required env: ${key}`);
      failed = true;
    } else {
      console.log(`✅ ${key}=${mask(value)}`);
    }
  }

  const rpcKey = NETWORK_RPC_ENV[network.name];
  if (rpcKey && network.name !== 'hardhat') {
    const rpcValue = (process.env[rpcKey] || '').trim();
    if (!rpcValue) {
      console.error(`❌ Missing required env for ${network.name}: ${rpcKey}`);
      failed = true;
    } else {
      console.log(`✅ ${rpcKey}=${mask(rpcValue)}`);
    }
  }

  if (!fs.existsSync(deployConfigPath)) {
    console.error(`❌ Deploy config not found: ${deployConfigPath}`);
    failed = true;
  } else {
    console.log(`✅ Deploy config found: ${deployConfigPath}`);
  }

  try {
    const [signer] = await ethers.getSigners();
    const chain = await ethers.provider.getNetwork();
    const balance = await ethers.provider.getBalance(signer.address);
    console.log(`✅ signer=${signer.address}`);
    console.log(`✅ chainId=${chain.chainId}`);
    console.log(`✅ signerBalanceWei=${balance.toString()}`);
  } catch (error) {
    console.error(`❌ RPC/signing check failed: ${String(error.message || error)}`);
    failed = true;
  }

  if (failed) {
    throw new Error('Hardhat doctor failed. Fix the issues above before release operations.');
  }

  console.log('✅ Hardhat doctor passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

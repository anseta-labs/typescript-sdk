/**
 * Lists the Ethereum validators provisioned under your account.
 *
 * Run with: ANSETA_API_KEY=... npx tsx examples/list-ethereum-validators.ts
 */
import { EthereumStakingApi, EthereumNetwork } from '../src';
import { config } from './client';

const NETWORK = EthereumNetwork.EthereumHoodiTestnet;

const ethereumApi = new EthereumStakingApi(config);

async function main(): Promise<void> {
  const validators = await ethereumApi.ethereumGetValidators({ network: NETWORK });
  console.log(validators.data);
}

main();

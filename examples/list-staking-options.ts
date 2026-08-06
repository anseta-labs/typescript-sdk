/**
 * Lists the network and token pairs you can stake.
 *
 * Run with: STAKEFI_API_KEY=... npx tsx examples/list-staking-options.ts
 */
import { APIInfoApi, StakingNetwork } from '../src';
import { config } from './client';

const NETWORK = StakingNetwork.Mantra;

const infoApi = new APIInfoApi(config);

async function main(): Promise<void> {
  const options = await infoApi.getStakingOptions({ network: NETWORK });
  console.log(options.data);
}

main();

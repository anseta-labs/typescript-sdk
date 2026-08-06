/**
 * Lists the validators available on one network.
 *
 * Run with: STAKEFI_API_KEY=... npx tsx examples/list-validators.ts
 */
import { SimpleStakingApi, StakingNetwork } from '../src';
import { config } from './client';

const NETWORK = StakingNetwork.Mantra;

const stakingApi = new SimpleStakingApi(config);

async function main(): Promise<void> {
  const validators = await stakingApi.getValidators({ network: NETWORK });
  console.log(validators.data);
}

main();

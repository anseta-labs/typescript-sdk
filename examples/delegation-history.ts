/**
 * Reads a validator's delegation and undelegation events.
 *
 * Run with: ANSETA_API_KEY=... npx tsx examples/delegation-history.ts
 */
import { SimpleStakingApi } from '../src';
import { config } from './client';

const VALIDATOR_ID = '53370563-e823-4d5d-8dd5-1c6b27a61a2a';
const LIMIT = '50';

const stakingApi = new SimpleStakingApi(config);

async function main(): Promise<void> {
  const history = await stakingApi.getStakingDelegationHistory({
    validatorId: VALIDATOR_ID,
    limit: LIMIT,
  });
  console.log(history.data);
}

main();

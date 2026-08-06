/**
 * Reads a validator's daily reward history over a date range.
 *
 * Run with: STAKEFI_API_KEY=... npx tsx examples/daily-rewards.ts
 */
import { SimpleStakingApi } from '../src';
import { config } from './client';

const VALIDATOR_ID = '53370563-e823-4d5d-8dd5-1c6b27a61a2a';
const START_DATE = '2024-10-19';
const END_DATE = '2024-10-31';

const stakingApi = new SimpleStakingApi(config);

async function main(): Promise<void> {
  const rewards = await stakingApi.getStakingDailyRewards({
    validatorId: VALIDATOR_ID,
    startDate: START_DATE,
    endDate: END_DATE,
  });
  console.log(rewards.data);
}

main();

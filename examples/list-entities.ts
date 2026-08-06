/**
 * Lists staking entities and the validators they run.
 *
 * Run with: STAKEFI_API_KEY=... npx tsx examples/list-entities.ts
 */
import { APIInfoApi } from '../src';
import { config } from './client';

const infoApi = new APIInfoApi(config);

async function main(): Promise<void> {
  const entities = await infoApi.getEntities({ active: 'true' });
  console.log(entities.data);
}

main();

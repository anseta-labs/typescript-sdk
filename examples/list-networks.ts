/**
 * Lists every network the API knows about.
 *
 * Run with: STAKEFI_API_KEY=... npx tsx examples/list-networks.ts
 */
import { APIInfoApi } from '../src';
import { config } from './client';

const infoApi = new APIInfoApi(config);

async function main(): Promise<void> {
  const networks = await infoApi.getNetworks({});
  console.log(networks.data);
}

main();

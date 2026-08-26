/**
 * Lists the tokens available on one network.
 *
 * Run with: ANSETA_API_KEY=... npx tsx examples/list-tokens.ts
 */
import { APIInfoApi, StakingNetwork } from '../src';
import { config } from './client';

const NETWORK = StakingNetwork.Ethereum;

const infoApi = new APIInfoApi(config);

async function main(): Promise<void> {
  const tokens = await infoApi.getTokens({ network: NETWORK });
  console.log(tokens.data);
}

main();

/**
 * Lists the EigenLayer operators you can delegate to.
 *
 * Run with: STAKEFI_API_KEY=... npx tsx examples/list-restaking-operators.ts
 */
import { EigenlayerRestakingApi } from '../src';
import { config } from './client';

const restakingApi = new EigenlayerRestakingApi(config);

async function main(): Promise<void> {
  const operators = await restakingApi.getRestakingOperators();
  console.log(operators.data);
}

main();

/**
 * Builds the approve and deposit transactions for an EigenLayer strategy.
 *
 * Run with: STAKEFI_API_KEY=... npx tsx examples/restaking-deposit.ts
 */
import {
  EigenlayerRestakingApi,
  RestakingDepositRequest,
  RestakingNetwork,
  RestakingToken,
} from '../src';
import { config } from './client';

const NETWORK = RestakingNetwork.Ethereum;
const TOKEN = RestakingToken.Steth;
const STAKER = '0x1659d5616d741b3ac9dbf940d0a9e92fcefffd5d';
// Base units, not whole tokens. stETH has 18 decimals, so this is 1 stETH.
const AMOUNT = '1000000000000000000';

const restakingApi = new EigenlayerRestakingApi(config);

async function main(): Promise<void> {
  const restakingDepositRequest: RestakingDepositRequest = {
    network: NETWORK,
    token: TOKEN,
    amount: AMOUNT,
    staker: STAKER,
  };

  const deposit = await restakingApi.createRestakingDeposit({ restakingDepositRequest });
  console.log(deposit.data);
}

main();

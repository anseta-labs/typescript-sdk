/**
 * Delegates already deposited assets to an EigenLayer operator.
 *
 * Run with: STAKEFI_API_KEY=... npx tsx examples/restaking-delegate.ts
 */
import { EigenlayerRestakingApi, RestakingDelegateRequest, RestakingNetwork } from '../src';
import { config } from './client';

const NETWORK = RestakingNetwork.Ethereum;
const STAKER = '0x1659d5616d741b3ac9dbf940d0a9e92fcefffd5d';
const OPERATOR = '0x9f55f922e05438e57e60755ca9670337950b68b1';

const restakingApi = new EigenlayerRestakingApi(config);

async function main(): Promise<void> {
  const restakingDelegateRequest: RestakingDelegateRequest = {
    network: NETWORK,
    staker: STAKER,
    operator: OPERATOR,
  };

  const delegate = await restakingApi.createRestakingDelegation({ restakingDelegateRequest });
  console.log(delegate.data);
}

main();

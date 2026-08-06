/**
 * Reads one address's stake with one validator.
 *
 * Run with: STAKEFI_API_KEY=... npx tsx examples/get-staking-position.ts
 */
import { SimpleStakingApi, StakingNetwork, StakingToken } from '../src';
import { config } from './client';

const NETWORK = StakingNetwork.Mantra;
const TOKEN = StakingToken.Mantra;
const STAKER = 'mantra1fz9hdjrupmtu6l490vurlj6d8dkp4t0p6gg57f';
const VALIDATOR = 'mantravaloper1r3s4pefpz69fk4rq8sn0zt2wxnv09uffz06nxu';

const stakingApi = new SimpleStakingApi(config);

async function main(): Promise<void> {
  const position = await stakingApi.getStakingPositions({
    staker: STAKER,
    validator: VALIDATOR,
    network: NETWORK,
    token: TOKEN,
  });
  console.log(position.data);
}

main();

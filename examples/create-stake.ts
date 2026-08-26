/**
 * Builds an unsigned stake transaction. You sign and broadcast it yourself.
 *
 * Run with: ANSETA_API_KEY=... npx tsx examples/create-stake.ts
 */
import { SimpleStakingApi, SimplifiedStakeRequest, StakingNetwork, StakingToken } from '../src';
import { config } from './client';

const NETWORK = StakingNetwork.Mantra;
const TOKEN = StakingToken.Mantra;
const STAKER = 'mantra1fz9hdjrupmtu6l490vurlj6d8dkp4t0p6gg57f';
const VALIDATOR = 'mantravaloper1r3s4pefpz69fk4rq8sn0zt2wxnv09uffz06nxu';
// Base units, not whole tokens. MANTRA has 18 decimals, so this is 1 MANTRA.
const AMOUNT = '1000000000000000000';

const stakingApi = new SimpleStakingApi(config);

async function main(): Promise<void> {
  const simplifiedStakeRequest: SimplifiedStakeRequest = {
    network: NETWORK,
    token: TOKEN,
    amount: AMOUNT,
    staker: STAKER,
    validator: VALIDATOR,
  };

  const stake = await stakingApi.createStake({ simplifiedStakeRequest });
  console.log(stake.data);
}

main();

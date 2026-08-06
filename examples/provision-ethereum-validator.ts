/**
 * Provisions an Ethereum validator and returns the deposit transaction to sign.
 * Running this against mainnet commits 32 ETH.
 *
 * Run with: STAKEFI_API_KEY=... npx tsx examples/provision-ethereum-validator.ts
 */
import { EthereumStakingApi, EthereumNetwork, EthereumStakeRequest } from '../src';
import { config } from './client';

const NETWORK = EthereumNetwork.EthereumHoodiTestnet;
const VALIDATOR_NAME = 'example-validator-1';
// Where the stake returns when the validator exits.
const WITHDRAWAL_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
// Where execution layer tips and MEV are paid.
const FEE_RECIPIENT = '0x388C818CA8B9251b393131C08a736A67ccB19297';
// One validator is 32 ETH, in wei.
const AMOUNT_WEI = '32000000000000000000';

const ethereumApi = new EthereumStakingApi(config);

async function main(): Promise<void> {
  const ethereumStakeRequest: EthereumStakeRequest = {
    network: NETWORK,
    amountWei: AMOUNT_WEI,
    withdrawalAddress: WITHDRAWAL_ADDRESS,
    feeRecipient: FEE_RECIPIENT,
    validatorName: VALIDATOR_NAME,
  };

  // The idempotency key makes a retried call return the same validator
  // instead of provisioning a second one.
  const staked = await ethereumApi.ethereumStake({
    idempotencyKey: VALIDATOR_NAME,
    ethereumStakeRequest,
  });
  console.log(staked.data);
}

main();

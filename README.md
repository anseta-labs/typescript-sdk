# Anseta TypeScript SDK

Type-safe TypeScript/JavaScript client for the [Anseta Developer API](https://docs.stakefi.network).

The code in `src/` is generated from the API's OpenAPI 3.1 specification with [OpenAPI Generator](https://openapi-generator.tech) (`typescript-fetch`). Do not edit it by hand: change the API spec and re-run `pnpm run generate`.

## Install

```bash
npm install @anseta/typescript-sdk
# or
pnpm add @anseta/typescript-sdk
```

Requires Node.js 18 or newer (uses the global `fetch`). In older Node versions pass your own fetch implementation through `Configuration.fetchApi`.

## Authenticate

The API takes an API key in the `x-api-key` header. Set `apiKey` on the `Configuration` and every request gets the header:

```typescript
import { Configuration } from '@anseta/typescript-sdk';

const config = new Configuration({
  basePath: 'https://preview.api.stakefi.network',
  apiKey: process.env.ANSETA_API_KEY!,
});
```

Passing it as a default header instead works the same way and is useful when you also want other headers:

```typescript
const config = new Configuration({
  headers: { 'x-api-key': process.env.ANSETA_API_KEY! },
});
```

`basePath` defaults to `https://preview.api.stakefi.network`, so you only need to set it when pointing at another environment (for example `http://localhost:8081` in local development).

## Usage

```typescript
import {
  Configuration,
  APIInfoApi,
  SimpleStakingApi,
  SimplifiedStakeRequest,
  StakingNetwork,
  StakingToken,
} from '@anseta/typescript-sdk';

const config = new Configuration({
  apiKey: process.env.ANSETA_API_KEY!,
});

const infoApi = new APIInfoApi(config);
const stakingApi = new SimpleStakingApi(config);

// Every supported network
const networks = await infoApi.getNetworks({});
console.log(networks.data);

// Validators on one network
const validators = await stakingApi.getValidators({ network: StakingNetwork.Mantra });
console.log(validators.data);

// Staking positions for an address
const positions = await stakingApi.getStakingPositions({
  staker: 'mantra1fz9hdjrupmtu6l490vurlj6d8dkp4t0p6gg57f',
  validator: 'mantravaloper1r3s4pefpz69fk4rq8sn0zt2wxnv09uffz06nxu',
  token: StakingToken.Mantra,
  network: StakingNetwork.Mantra,
});
console.log(positions.data);

// Build an unsigned stake transaction
const simplifiedStakeRequest: SimplifiedStakeRequest = {
  network: StakingNetwork.Mantra,
  token: StakingToken.Mantra,
  // Base units, not whole tokens. MANTRA has 18 decimals, so this is 1 MANTRA.
  amount: '1000000000000000000',
  staker: 'mantra1fz9hdjrupmtu6l490vurlj6d8dkp4t0p6gg57f',
  validator: 'mantravaloper1r3s4pefpz69fk4rq8sn0zt2wxnv09uffz06nxu',
};

const stake = await stakingApi.createStake({ simplifiedStakeRequest });
console.log(stake.data);

// Daily reward history for a validator
const rewards = await stakingApi.getStakingDailyRewards({
  validatorId: '53370563-e823-4d5d-8dd5-1c6b27a61a2a',
  startDate: '2024-10-19',
  endDate: '2024-10-31',
});
console.log(rewards.data);
```

Methods return the parsed response body directly. Use the `...Raw` variant of any method (for example `getNetworksRaw`) when you need the underlying `Response` object, its status code, or headers.

## Networks and tokens

Network and token values are shared enums, not per-endpoint ones. The lists genuinely differ by scope, so there are several:

| Type | Values | Used by |
|------|--------|---------|
| `Network` | Every network the API knows about | `getNetworks` |
| `StakingNetwork` | Networks that support staking | Staking endpoints, `getTokens`, `getStakingOptions` |
| `RestakingNetwork` | `ethereum`, `ethereum-hoodi-testnet` | EigenLayer restaking endpoints |
| `EthereumNetwork` | `ethereum`, `ethereum-hoodi-testnet` | Ethereum native staking endpoints |
| `StakingToken` | Token symbols that can be staked | Staking endpoints |
| `RestakingToken` | Token symbols that can be restaked | EigenLayer restaking endpoints |

These are `as const` objects plus string-literal union types, not TypeScript `enum`s, so a plain string literal works anywhere one is accepted.

## API classes

| Class | Covers |
|-------|--------|
| `APIInfoApi` | Networks, tokens, staking options, entities |
| `SimpleStakingApi` | Validators, positions, delegation and reward history, stake/unstake/withdraw transactions |
| `EigenlayerRestakingApi` | Operators, restaking positions and history, deposit/delegate/undelegate/unstake/withdraw transactions |
| `EthereumStakingApi` | Provision, confirm, cancel, exit, force exit, and withdraw from your own Ethereum validators, plus validator listing and staking/reward history |
| `SystemApi` | Health check and the OpenAPI spec endpoint |

## Errors

A non-2xx response throws a `ResponseError` carrying the raw `Response`:

```typescript
import { ResponseError, StakingNetwork } from '@anseta/typescript-sdk';

try {
  await stakingApi.getValidators({ network: StakingNetwork.Mantra });
} catch (error) {
  if (error instanceof ResponseError) {
    console.error(error.response.status, await error.response.json());
  } else {
    throw error;
  }
}
```

`RequiredError` is thrown before any request is sent when a required parameter is missing.

## Examples

Runnable scripts live in `examples/`. Each one makes a single API call, with the addresses, validator IDs, amounts, and dates as plain constants at the top for you to edit. `ANSETA_API_KEY` is required; `ANSETA_BASE_URL` is optional and defaults to the preview host.

```bash
ANSETA_API_KEY=... npx tsx examples/list-networks.ts

# against a local API instead of the default preview host
ANSETA_API_KEY=... ANSETA_BASE_URL=http://localhost:8081 \
  npx tsx examples/list-networks.ts
```

The addresses and IDs are real values from the Anseta validator set, so the scripts run as-is.

| File | Calls |
|------|-------|
| `list-networks.ts` | `getNetworks` |
| `list-tokens.ts` | `getTokens` |
| `list-staking-options.ts` | `getStakingOptions` |
| `list-entities.ts` | `getEntities` |
| `list-validators.ts` | `getValidators` |
| `get-staking-position.ts` | `getStakingPositions` |
| `create-stake.ts` | `createStake` |
| `create-unstake.ts` | `createUnstake` |
| `daily-rewards.ts` | `getStakingDailyRewards` |
| `delegation-history.ts` | `getStakingDelegationHistory` |
| `list-ethereum-validators.ts` | `ethereumGetValidators` |
| `provision-ethereum-validator.ts` | `ethereumStake` |
| `list-restaking-operators.ts` | `getRestakingOperators` |
| `restaking-deposit.ts` | `createRestakingDeposit` |
| `restaking-delegate.ts` | `createRestakingDelegation` |

`client.ts` holds the shared `Configuration` and is the only file that reads an environment variable.

## Regenerating

```bash
pnpm install

# From the API repo's spec, which is what you normally want
ANSETA_SPEC=../stakefi-developer-api/openapi.json pnpm run generate

# Or from a deployment
ANSETA_SPEC=https://preview.api.stakefi.network/v1/openapi.json pnpm run generate

pnpm run build
```

There is no default spec source and `pnpm run generate` fails without one. That is deliberate: the deployed spec lags the API repo, and `generate` deletes `src/` before regenerating, so a silent fallback would quietly rebuild the client against an older API.

`scripts/prepare-spec.mjs` writes `openapi.json` and pins `servers[0]` to `https://preview.api.stakefi.network`, which is what the generator turns into the default base path. The base URL is pinned here rather than read from the upstream spec, whose own server list has advertised hosts that do not resolve. Override it with `ANSETA_BASE_URL`.

`pnpm run generate:code` regenerates from whatever `openapi.json` is already on disk, without fetching.

Generator settings live in `openapitools.json`. `.openapi-generator-ignore` keeps the generator from overwriting this repo's `package.json`, `tsconfig*.json`, `README.md`, `.gitignore`, and `.npmignore`.

Requires a JDK on `PATH` (the generator runs as a jar).

## Scripts

| Script | Does |
|--------|------|
| `pnpm run generate` | Fetch the spec (`ANSETA_SPEC`) and regenerate `src/` |
| `pnpm run generate:code` | Regenerate `src/` from the existing `openapi.json` |
| `pnpm run build` | Compile CommonJS to `dist/` and ESM to `dist/esm/` |
| `pnpm run typecheck` | Type-check `src/` without emitting |
| `pnpm run typecheck:examples` | Type-check `examples/` against `src/` |
| `pnpm run format` | Prettier over `scripts/` and `examples/`, never the generated `src/` |

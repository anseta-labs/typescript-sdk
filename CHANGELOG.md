# Changelog

All notable changes to `@anseta/typescript-sdk` are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the package
follows [semantic versioning](https://semver.org/spec/v2.0.0.html).

The version of this package describes **its own TypeScript surface**, not the
version of the Anseta API.

## Unreleased

## 0.2.0 - 2026-08-31

### Added
- `ethereumTopup` and `ethereumConsolidate` operations
- Typed responses for staking positions, validators and restaking operators: `Stake`, `Validator`, `Operator`, and their response wrappers

### Changed
- `EntityValidator` is now `Validator`, with `EntityValidatorNetwork` becoming `ValidatorNetwork`. The shape is unchanged
- `GetStakingPositions200Response` and `GetValidators200Response` are replaced by `GetStakesResponse` and `GetValidatorsResponse`, whose `data` is typed rather than `any`

## 0.1.0 - 2026-08-27

First release. The client is generated from the Anseta Developer API's OpenAPI
specification with OpenAPI Generator (`typescript-fetch`).

### Added

- `APIInfoApi` for networks, tokens, staking options, and entities
- `SimpleStakingApi` for validators, positions, history, and stake, unstake,
  and withdraw transaction building
- `EigenlayerRestakingApi` for restaking operators, history, and transaction
  building
- `EthereumStakingApi` for provisioning, exiting, and withdrawing from
  dedicated Ethereum validators
- `SystemApi` for the health check and the specification endpoint
- Dual CommonJS and ESM builds, with TypeScript declarations

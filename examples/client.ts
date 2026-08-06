import { Configuration } from '../src';

const { STAKEFI_API_KEY } = process.env;
if (!STAKEFI_API_KEY) {
  throw new Error('STAKEFI_API_KEY is not set');
}

// basePath falls back to the SDK's own default when STAKEFI_BASE_URL is unset.
export const config = new Configuration({
  apiKey: STAKEFI_API_KEY,
  basePath: process.env.STAKEFI_BASE_URL,
});

import { Configuration } from '../src';

const { ANSETA_API_KEY } = process.env;
if (!ANSETA_API_KEY) {
  throw new Error('ANSETA_API_KEY is not set');
}

// basePath falls back to the SDK's own default when ANSETA_BASE_URL is unset.
export const config = new Configuration({
  apiKey: ANSETA_API_KEY,
  basePath: process.env.ANSETA_BASE_URL,
});

/**
 * Configures Amplify (auth + data) from the generated outputs.
 *
 * `amplify_outputs.json` is gitignored and produced by `npm run prod-config`
 * (locally and in CI). It holds the Cognito pool + AppSync endpoint — public
 * client config, not secrets. Import this module once, at app startup.
 */
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);

export { outputs };

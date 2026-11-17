/**
 * Stand-in for the `aws-amplify` root in fake mode: configure() is a no-op
 * that announces the mode on <html data-backend="fake"> so a human, the e2e
 * harness or an agent can SEE no real cloud is involved.
 */
export const Amplify = {
  configure(_outputs: unknown): void {
    document.documentElement.dataset.backend = 'fake';
  },
};

import { defineAuth } from '@aws-amplify/backend';

/**
 * Cognito auth for Noms.
 *
 * `editors` gates the seed runner + any admin/authoring writes (mirrors the
 * stoop/spork convention). Day-to-day users sign in with email and collaborate
 * on shared noms via the per-record `members` owner list — see the Nom model.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['editors'],
});

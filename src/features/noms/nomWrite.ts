/** Shared bits for nom write hooks: userPool auth + the actor stamp. */

export const AUTH = { authMode: 'userPool' } as const;

/** Identity stamped on every write so the push Lambda knows who acted. */
export interface Actor {
  sub: string;
  label: string;
}

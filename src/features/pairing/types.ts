/** Shared types for pairing. */

export interface Pairing {
  id: string;
  members: string[];
  inviterEmail: string;
  inviteeEmail: string;
  status: 'PENDING' | 'ACTIVE' | null;
}

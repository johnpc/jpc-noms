import { useMutation } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';
import { useNomMembership } from './useNomMembership';
import { showToast } from '../../lib/toast';
import { success } from '../../lib/haptics';

const AUTH = { authMode: 'userPool' } as const;

/**
 * "Poke your partner" — fire an on-demand nudge push to the other member. The
 * partner is the member sub that isn't me; only available when paired. A toast
 * + success haptic confirm the send.
 */
export function usePoke() {
  const { paired, sub, members, actor } = useNomMembership();
  const partnerSub = members.find((m) => m !== sub);

  const poke = useMutation({
    mutationFn: async () => {
      if (!partnerSub) return;
      await dataClient.mutations.pokePartner({ partnerSub, fromLabel: actor.label }, AUTH);
    },
    onSuccess: () => {
      void success();
      void showToast('👋 Poked your partner');
    },
  });

  return {
    canPoke: paired && !!partnerSub,
    poke: () => poke.mutate(),
    poking: poke.isPending,
  };
}

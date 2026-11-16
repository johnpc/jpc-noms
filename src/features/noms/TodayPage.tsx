import { IonButton } from '@ionic/react';
import { useToday } from './useToday';
import { NomOptionsSection } from './NomOptionsSection';
import { NomFooterActions } from './NomFooterActions';
import { PreviousPick } from './PreviousPick';
import { PokeButton } from './PokeButton';
import { SelectedBanner } from './SelectedBanner';
import { Prompt } from './Prompt';
import { PageShell } from './PageShell';

/**
 * Today's nom — the app's primary screen. Renders by switching on the hook's
 * `screen` union: sign-in prompt, nothing while the first load is in flight
 * (no "No nom yet" flash), the empty call-to-action, or today's options with
 * the decided banner once picked. The full noms history lives under Stats.
 */
export function TodayPage() {
  const d = useToday();
  const { screen } = d;
  if (screen.kind === 'signed-out')
    return (
      <PageShell title="Today’s nom">
        {<Prompt testid="today-signin">Sign in to start today’s nom.</Prompt>}
      </PageShell>
    );

  return (
    <PageShell title="Today’s nom">
      {screen.kind !== 'loading' && d.previous && <PreviousPick nom={d.previous} />}
      {screen.kind !== 'loading' && <PokeButton />}
      {screen.kind === 'empty' && (
        <div data-testid="today-empty">
          <Prompt testid="today-empty-msg">
            No nom yet today — find a restaurant and tap “➕ Nom” to start one.
          </Prompt>
          <IonButton expand="block" routerLink="/search" data-testid="today-find">
            Find a restaurant
          </IonButton>
        </div>
      )}
      {(screen.kind === 'open' || screen.kind === 'decided') && (
        <>
          {screen.kind === 'decided' && <SelectedBanner nom={screen.nom} />}
          <NomOptionsSection
            nom={screen.nom}
            selected={screen.kind === 'decided'}
            addable={d.addable}
            busy={d.busy}
            onSelect={d.select}
            onRemove={d.remove}
            onAdd={d.add}
          />
          <NomFooterActions
            selected={screen.kind === 'decided'}
            hasOptions={screen.nom.optionPlaceIds.length > 0}
            busy={d.busy}
            onDecide={d.decideForUs}
            onReopen={d.reopen}
            onDelete={d.del}
          />
        </>
      )}
    </PageShell>
  );
}

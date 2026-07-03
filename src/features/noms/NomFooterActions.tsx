import { IonButton } from '@ionic/react';

interface Props {
  selected: boolean;
  hasOptions: boolean;
  busy: boolean;
  onDecide: () => void;
  onReopen: () => void;
  onDelete: () => void;
}

/** Footer actions for a nom: decide-for-us (open + has options), reopen (once
 * selected), and delete (always). Kept out of NomDetail to respect the line budget. */
export function NomFooterActions({
  selected,
  hasOptions,
  busy,
  onDecide,
  onReopen,
  onDelete,
}: Props) {
  return (
    <div className="nom-footer" data-testid="nom-footer">
      {!selected && hasOptions && (
        <IonButton expand="block" disabled={busy} onClick={onDecide} data-testid="nom-decide-btn">
          🎲 Decide for us
        </IonButton>
      )}
      {selected && (
        <IonButton
          expand="block"
          fill="outline"
          disabled={busy}
          onClick={onReopen}
          data-testid="nom-reopen-btn"
        >
          Re-open (change our mind)
        </IonButton>
      )}
      <IonButton
        expand="block"
        fill="clear"
        color="danger"
        disabled={busy}
        onClick={onDelete}
        data-testid="nom-delete-btn"
      >
        Delete nom
      </IonButton>
    </div>
  );
}

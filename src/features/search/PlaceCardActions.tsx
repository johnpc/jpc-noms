import { IonButton } from '@ionic/react';

export interface PlaceActions {
  /** Primary action label (e.g. "Add to rotation"), omitted for a static card. */
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  /** Optional secondary action (e.g. "Remove") shown as a subtle text button. */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Optional "add to today's nom" action, shown as an outline button. */
  onNom?: () => void;
  nomDisabled?: boolean;
  /** True once this place is already in today's nom — shows "In nom ✓". */
  nominated?: boolean;
}

/** The action-button row for a PlaceCard. Split out to keep PlaceCard small. */
export function PlaceCardActions({
  actionLabel,
  onAction,
  actionDisabled,
  secondaryLabel,
  onSecondary,
  onNom,
  nomDisabled,
  nominated,
}: PlaceActions) {
  return (
    <>
      {actionLabel && (
        <IonButton
          size="small"
          fill="solid"
          onClick={onAction}
          disabled={actionDisabled}
          data-testid="place-card-action"
        >
          {actionLabel}
        </IonButton>
      )}
      {onNom && (
        <IonButton
          size="small"
          fill={nominated ? 'clear' : 'outline'}
          color={nominated ? 'success' : undefined}
          onClick={onNom}
          disabled={nomDisabled || nominated}
          data-testid="place-card-nom"
        >
          {nominated ? 'In nom ✓' : '➕ Nom'}
        </IonButton>
      )}
      {secondaryLabel && (
        <IonButton
          size="small"
          fill="clear"
          color="medium"
          onClick={onSecondary}
          disabled={actionDisabled}
          data-testid="place-card-secondary"
        >
          {secondaryLabel}
        </IonButton>
      )}
    </>
  );
}

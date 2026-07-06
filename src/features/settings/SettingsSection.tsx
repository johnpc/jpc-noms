import type { ReactNode } from 'react';

type Props = { title: string; children: ReactNode };

/** A titled settings group: a muted uppercase title above a rounded surface
 * card holding the rows. The shared iOS grouped-list look (see settings.css). */
export function SettingsSection({ title, children }: Props) {
  return (
    <section className="settings-section">
      <h2 className="settings-section__title">{title}</h2>
      <div className="settings-card">{children}</div>
    </section>
  );
}

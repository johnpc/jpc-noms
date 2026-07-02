/**
 * Brand fonts, bundled via fontsource (not a CDN) so the app works offline
 * inside Capacitor. Only the weights the design uses are imported, to keep the
 * bundle lean.
 *
 * - Inter (sans): all UI chrome and card text.
 * - Newsreader (serif): card fronts/backs where an editorial feel helps.
 */

// Inter — 400 (body), 500 (labels), 600 (headings/buttons), 700 (display)
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Newsreader — 500/600 for card faces
import '@fontsource/newsreader/500.css';
import '@fontsource/newsreader/600.css';

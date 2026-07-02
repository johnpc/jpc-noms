// Minimal service worker for Noms. Its only job today is to make the app
// installable as a PWA — Chromium requires a registered SW (plus the manifest)
// before it fires `beforeinstallprompt`. We deliberately do NOT cache anything
// yet: every request passes straight through to the network, so there is no
// stale-asset risk. Offline/precache support can be layered on later.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // No-op: let the browser handle the request normally (network passthrough).
});

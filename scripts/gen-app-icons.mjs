#!/usr/bin/env node
/**
 * Generate all app icons from the brand source art:
 *   assets/icon.png       — full-bleed light icon (plate + fork/knife on coral)
 *   assets/icon-dark.png  — full-bleed dark icon (glowing plate on charcoal)
 *
 * Produces, deterministically (no @capacitor/assets — it mangled paths/dark):
 *   • PWA         → public/icons/icon-{48..512}.png + maskable-{192,512}.png
 *   • Favicon     → public/favicon.png + public/apple-touch-icon.png
 *   • iOS         → AppIcon.appiconset light + dark + tinted (1024) + Contents.json
 *
 * iOS only — no Android target for this app.
 * Re-run after changing the source art:  node scripts/gen-app-icons.mjs
 * Not a shipped logic file (build script) — lives outside src/ + amplify/.
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LIGHT = join(ROOT, 'assets/icon.png');
const DARK = join(ROOT, 'assets/icon-dark.png');
const BRAND_BG = { r: 0xff, g: 0x6b, b: 0x5c };

const PWA_SIZES = [48, 72, 96, 128, 192, 256, 384, 512];

const resizeTo = (src, size) => sharp(src).resize(size, size, { fit: 'cover' }).png();

/** Maskable: shrink the art to ~78% on a solid brand field (safe-zone padding). */
async function maskable(src, size, bg) {
  const inner = Math.round(size * 0.78);
  const art = await sharp(src).resize(inner, inner, { fit: 'cover' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function pwa() {
  const dir = join(ROOT, 'public/icons');
  mkdirSync(dir, { recursive: true });
  for (const s of PWA_SIZES) await resizeTo(LIGHT, s).toFile(join(dir, `icon-${s}.png`));
  for (const s of [192, 512]) {
    writeFileSync(join(dir, `maskable-${s}.png`), await maskable(LIGHT, s, BRAND_BG));
  }
  console.log(`PWA: ${PWA_SIZES.length} icons + 2 maskable`);
}

/** Browser favicon + iOS home-screen touch icon, from the same light art. */
async function favicon() {
  const dir = join(ROOT, 'public');
  // 32px favicon (crisp in the tab); 180px apple-touch-icon (home screen).
  await resizeTo(LIGHT, 32).toFile(join(dir, 'favicon.png'));
  await resizeTo(LIGHT, 180).toFile(join(dir, 'apple-touch-icon.png'));
  console.log('Favicon: favicon.png (32) + apple-touch-icon.png (180)');
}

async function ios() {
  const dir = join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
  mkdirSync(dir, { recursive: true });
  await resizeTo(LIGHT, 1024).toFile(join(dir, 'AppIcon-512@2x.png'));
  await resizeTo(DARK, 1024).toFile(join(dir, 'AppIcon-512@2x-dark.png'));
  // Tinted: iOS renders a monochrome mask; a grayscale of the light art reads best.
  await sharp(LIGHT)
    .resize(1024, 1024, { fit: 'cover' })
    .grayscale()
    .png()
    .toFile(join(dir, 'AppIcon-512@2x-tinted.png'));
  const img = (filename, appearance) => ({
    idiom: 'universal',
    platform: 'ios',
    size: '1024x1024',
    filename,
    ...(appearance ? { appearances: [{ appearance: 'luminosity', value: appearance }] } : {}),
  });
  writeFileSync(
    join(dir, 'Contents.json'),
    JSON.stringify(
      {
        images: [
          img('AppIcon-512@2x.png'),
          img('AppIcon-512@2x-dark.png', 'dark'),
          img('AppIcon-512@2x-tinted.png', 'tinted'),
        ],
        info: { author: 'xcode', version: 1 },
      },
      null,
      2,
    ),
  );
  console.log('iOS: light + dark + tinted AppIcon');
}

await pwa();
await favicon();
await ios();
console.log('✓ app icons generated');

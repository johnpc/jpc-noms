#!/usr/bin/env bash
# iOS launch smoke test: does the BUILT app actually launch in the simulator and
# render its web view? Run on a Mac with Xcode (the Mac mini / CI):
#
#   bash scripts/ios-launch-smoke.sh            # build web (fake backend) + app, run the check
#   SMOKE_WEB_BUILD=0 bash scripts/ios-launch-smoke.sh   # reuse the dist/ already built (CI)
#   bash scripts/ios-launch-smoke.sh cleanup    # remove this run's simulator
#
# WHY: a build made with the Xcode 27 SDK could not launch AT ALL ("UIScene life
# cycle is required for apps built with this SDK") — yet it archived, uploaded,
# passed every unit + Gherkin test (they run in a browser) and reached App Review,
# which rejected jpc.eats 4.0.0 for "crashed on launch". Nothing in the pipeline
# ever started the real binary. This does. PASS requires, in a fresh simulator:
#   1. the app process is alive and Capacitor logs "WebView loaded" (the web app
#      rendered inside the native shell) within SMOKE_LOAD_SECS;
#   2. it is still alive SMOKE_ALIVE_SECS after launch;
#   3. no "UIScene life cycle is required" fault in the simulator log and no crash
#      report for the bundle id since launch.
# Output (screenshot, app stdout, xcodebuild log) lands in SMOKE_OUT.
#
# ML Kit caveat: Google's ML Kit pods (the QR pairing scanner) ship no arm64
# SIMULATOR slice — every version through GoogleMLKit 9.0.0 sets
# EXCLUDED_ARCHS[sdk=iphonesimulator*]=arm64 — and Xcode 27 dropped Rosetta
# simulators, so the shipped pod set cannot run in any simulator on this Mac. The
# smoke therefore builds the SAME App target (sources, Info.plist, storyboards,
# project file, web bundle) from a scratch copy of ios/App with only the
# CapacitorMlkitBarcodeScanning pod removed. It proves the native shell launches;
# it cannot exercise the scanner. ios/App/Pods is never touched.
set -euo pipefail
cd "$(dirname "$0")/.."

BUNDLE_ID="com.johncorser.eats"
SIM_NAME="${SMOKE_SIM_NAME:-noms-launch-smoke}"
DEVICE_TYPE="${SMOKE_DEVICE_TYPE:-com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro}"
LOAD_SECS="${SMOKE_LOAD_SECS:-90}"
ALIVE="${SMOKE_ALIVE_SECS:-20}"
OUT="${SMOKE_OUT:-ios-smoke-output}"
WEB_BUILD="${SMOKE_WEB_BUILD:-1}"

say() { echo "ios-smoke: $*"; }
fail() { echo "ios-smoke: FAIL — $*" >&2; exit 1; }

delete_sims() {
  for udid in $(xcrun simctl list devices | sed -n "s/^ *$SIM_NAME (\([0-9A-F-]*\)).*/\1/p"); do
    xcrun simctl shutdown "$udid" >/dev/null 2>&1 || true
    xcrun simctl delete "$udid" && say "deleted simulator $udid"
  done
}
if [ "${1:-}" = "cleanup" ]; then delete_sims; exit 0; fi

mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd) # absolute: `simctl launch --stdout` silently fails on a relative path
STARTED=$(date "+%Y-%m-%d %H:%M:%S")
MARKER="$OUT/.started"; touch "$MARKER"
UDID=""; SIMCTL_PID=""
cleanup() {
  [ -n "$SIMCTL_PID" ] && kill "$SIMCTL_PID" 2>/dev/null
  if [ -n "$UDID" ]; then
    xcrun simctl io "$UDID" screenshot "$OUT/launch.png" >/dev/null 2>&1 && say "screenshot → $OUT/launch.png" || true
    if [ "${SMOKE_KEEP_SIM:-0}" != "1" ]; then
      xcrun simctl shutdown "$UDID" >/dev/null 2>&1 || true
      xcrun simctl delete "$UDID" >/dev/null 2>&1 || true
    fi
  fi
}
trap cleanup EXIT

# ---- 1. Web bundle + native project -------------------------------------------
if [ "$WEB_BUILD" = "1" ]; then
  say "building the web app on the fake backend"
  FAKE_BACKEND=1 npm run build >"$OUT/web-build.log" 2>&1 || { tail -30 "$OUT/web-build.log" >&2; fail "web build failed"; }
  npx cap sync ios >"$OUT/cap-sync.log" 2>&1 || { tail -30 "$OUT/cap-sync.log" >&2; fail "cap sync failed"; }
else
  [ -d dist ] || fail "SMOKE_WEB_BUILD=0 but dist/ is missing"
fi

# ---- 2. Scratch copy of the iOS project without the ML Kit pod (see header) ----------
# Same depth as ios/App so the Podfile's ../../node_modules paths still resolve.
SMOKE_IOS="$OUT/App"
rm -rf "$SMOKE_IOS"; mkdir -p "$SMOKE_IOS"
rsync -a --exclude Pods --exclude App.xcworkspace --exclude build ios/App/ "$SMOKE_IOS/"
grep -q "CapacitorMlkitBarcodeScanning" "$SMOKE_IOS/Podfile" || fail "expected the ML Kit pod in ios/App/Podfile — update this script if the scanner moved"
sed -i '' '/CapacitorMlkitBarcodeScanning/d' "$SMOKE_IOS/Podfile"
(cd "$SMOKE_IOS" && pod install >pod-install.log 2>&1) || { tail -20 "$SMOKE_IOS/pod-install.log" >&2; fail "pod install (smoke copy) failed"; }
cmp -s ios/App/App/Info.plist "$SMOKE_IOS/App/Info.plist" || fail "smoke copy drifted from ios/App"

# ---- 3. Fresh simulator + unsigned build for that device --------------------------------
delete_sims
UDID=$(xcrun simctl create "$SIM_NAME" "$DEVICE_TYPE") || fail "simctl create failed"
xcrun simctl boot "$UDID"
xcrun simctl bootstatus "$UDID" -b >/dev/null || fail "simulator never finished booting"
say "building App for simulator $UDID"
xcodebuild -workspace "$SMOKE_IOS/App.xcworkspace" -scheme App -configuration Debug \
  -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath "$OUT/DerivedData" \
  CODE_SIGNING_ALLOWED=NO ENABLE_DEBUG_DYLIB=NO build >"$OUT/xcodebuild.log" 2>&1 \
  || { grep -E "error:|BUILD FAILED" "$OUT/xcodebuild.log" | head -30 >&2; fail "xcodebuild failed (log: $OUT/xcodebuild.log)"; }
APP="$OUT/DerivedData/Build/Products/Debug-iphonesimulator/App.app"
[ -d "$APP" ] || fail "no app bundle at $APP"
/usr/libexec/PlistBuddy -c "Print :UIApplicationSceneManifest:UISceneConfigurations" "$APP/Info.plist" >/dev/null 2>&1 \
  || fail "the built Info.plist has no UIApplicationSceneManifest — the iOS 27 SDK will refuse to launch it"

# ---- 4. Install + launch ------------------------------------------------------------
xcrun simctl install "$UDID" "$APP" || fail "simctl install failed"
# Capacitor's "WebView loaded" is a Swift print(): fully buffered when simctl
# redirects stdout to a file (nothing ever arrives), line-buffered on a pty — so
# launch with --console-pty in the background and read the app's pid from the
# simulator's launchd. Right after boot + install, SpringBoard may not have
# registered the app yet and `simctl launch` exits with "did not return a process
# handle" — a readiness race, not a verdict; probe for up to 30 s. A launch that
# yields a pid is then judged by the checks below (a crashing app gets a pid and dies).
APP_PID=""
for _ in $(seq 1 10); do
  : >"$OUT/app.stdout"
  xcrun simctl launch --console-pty "$UDID" "$BUNDLE_ID" >>"$OUT/app.stdout" 2>&1 &
  SIMCTL_PID=$!
  for _ in 1 2 3; do
    sleep 1
    APP_PID=$(xcrun simctl spawn "$UDID" launchctl list 2>/dev/null | awk -v l="UIKitApplication:$BUNDLE_ID" '$0 ~ l && $1 ~ /^[0-9]+$/ {print $1; exit}')
    [ -n "$APP_PID" ] && break
    kill -0 "$SIMCTL_PID" 2>/dev/null || break
  done
  [ -n "$APP_PID" ] && break
  kill "$SIMCTL_PID" 2>/dev/null; wait "$SIMCTL_PID" 2>/dev/null || true
done
[ -n "$APP_PID" ] || { tail -5 "$OUT/app.stdout" >&2; fail "simctl launch never produced a running process within 30s"; }
LAUNCHED_AT=$(date +%s)
say "launched $BUNDLE_ID (pid $APP_PID)"

# ---- 5. The web view must load inside the native shell -------------------------
for _ in $(seq 1 "$LOAD_SECS"); do
  grep -q "WebView loaded" "$OUT/app.stdout" 2>/dev/null && break
  kill -0 "$APP_PID" 2>/dev/null || { tail -20 "$OUT/app.stdout" >&2; fail "the app process (pid $APP_PID) exited before its web view loaded — it did not launch"; }
  sleep 1
done
grep -q "WebView loaded" "$OUT/app.stdout" || fail "Capacitor never logged 'WebView loaded' within ${LOAD_SECS}s (see $OUT/app.stdout)"
say "web view loaded"

# ---- 6. Still alive, no scene fault, no crash --------------------------------------
REMAINING=$((ALIVE - ($(date +%s) - LAUNCHED_AT))); [ "$REMAINING" -gt 0 ] && sleep "$REMAINING"
kill -0 "$APP_PID" 2>/dev/null || fail "the app died within ${ALIVE}s of launch"
# iOS 27 words the fault "_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption …
# Application failed to launch"; older SDKs say "UIScene life cycle is required…".
# Exclude `log` itself: it echoes its own argv (this predicate!) into the stream.
FAULT=$(xcrun simctl spawn "$UDID" log show --style compact --start "$STARTED" \
  --predicate '(eventMessage CONTAINS "NoSceneLifecycleAdoption" OR eventMessage CONTAINS "UIScene life cycle") AND process != "log"' 2>/dev/null \
  | grep -E "NoSceneLifecycleAdoption|UIScene life cycle" | grep -v "args:" | head -3 || true)
[ -z "$FAULT" ] || fail "UIKit refused the scene life cycle: $FAULT"
CRASHES=$(find ~/Library/Logs/DiagnosticReports -maxdepth 1 -newer "$MARKER" -name "*.ips" 2>/dev/null | xargs grep -l "$BUNDLE_ID" 2>/dev/null || true)
[ -z "$CRASHES" ] || fail "crash report(s) for $BUNDLE_ID since launch: $CRASHES"
say "PASS — launched, web view loaded, alive after ${ALIVE}s, no scene fault or crash"

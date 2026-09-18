#!/usr/bin/env bash
set -euo pipefail

echo '=== ANDROID BUILD ==='
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk
adb shell getprop ro.product.model

echo '=== BROWSER PACKAGES ==='
adb shell pm list packages | grep -E 'chrome|chromium|webview' || true

if ! adb shell pm list packages | grep -q '^package:com.android.chrome'; then
  echo 'ANDROID_CHROME_NOT_PRESENT'
  exit 2
fi

echo '=== CHROME PACKAGE ==='
adb shell dumpsys package com.android.chrome | grep -E 'versionName=|versionCode=' | head -10 || true
adb shell pm enable com.android.chrome || true

dump_ui() {
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  adb pull /sdcard/window.xml /tmp/window.xml >/dev/null 2>&1 || true
  cat /tmp/window.xml 2>/dev/null || true
}

tap_matching_text() {
  NEEDLE="$1" python3 - <<'PY'
import os, re, subprocess, xml.etree.ElementTree as ET
p='/tmp/window.xml'
if not os.path.exists(p):
    raise SystemExit(1)
needle=os.environ['NEEDLE'].lower()
root=ET.parse(p).getroot()
for node in root.iter('node'):
    text=(node.attrib.get('text') or '') + ' ' + (node.attrib.get('content-desc') or '')
    if needle in text.lower():
        m=re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds',''))
        if m:
            x1,y1,x2,y2=map(int,m.groups())
            subprocess.run(['adb','shell','input','tap',str((x1+x2)//2),str((y1+y2)//2)],check=True)
            print('Tapped:', text.strip())
            raise SystemExit(0)
raise SystemExit(1)
PY
}

adb shell am force-stop com.android.chrome

# A fresh Play Store emulator can ignore the first VIEW intent while Chrome
# initializes. Launch twice before inspecting the first-run UI.
for attempt in 1 2; do
  adb shell am start -a android.intent.action.VIEW -d "https://trackdash.it/?android-diag=fre-$attempt" com.android.chrome || true
  sleep 5
done

echo '=== INITIAL CHROME UI ==='
dump_ui

# Complete any Chrome first-run/sign-in screens. Refresh the UI dump after
# every tap because the next page can use a different button label.
for round in 1 2 3 4 5; do
  handled=0
  for label in 'Use without an account' 'Accept & continue' 'No thanks' 'Got it'; do
    if tap_matching_text "$label"; then
      handled=1
      sleep 4
      dump_ui
      break
    fi
  done
  if [ "$handled" -eq 0 ]; then
    break
  fi
done

# Open TrackDash again only after the first-run experience is cleared.
adb shell am start -a android.intent.action.VIEW -d 'https://trackdash.it/?android-diag=ready' com.android.chrome
sleep 15

echo '=== TRACKDASH CHROME UI ==='
dump_ui

echo '=== CDP SOCKETS ==='
adb shell cat /proc/net/unix | grep -E 'chrome.*devtools|devtools.*chrome' || true

adb forward --remove tcp:9223 >/dev/null 2>&1 || true
adb forward tcp:9223 localabstract:chrome_devtools_remote

for i in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:9223/json/version >/tmp/android-chrome-version.json; then
    break
  fi
  sleep 1
done

echo '=== ANDROID CHROME CDP VERSION ==='
cat /tmp/android-chrome-version.json
echo
echo '=== ANDROID CHROME TABS ==='
curl -fsS http://127.0.0.1:9223/json/list | tee /tmp/android-chrome-tabs.json
echo

npm install --no-save --ignore-scripts chrome-remote-interface@0.33.3 >/dev/null

node <<'NODE'
const CDP = require('chrome-remote-interface')

;(async () => {
  const targets = await CDP.List({ host: '127.0.0.1', port: 9223 })
  const target = targets.find((t) => t.type === 'page' && t.url.includes('trackdash.it'))
  if (!target) {
    console.error('NO_TRACKDASH_TARGET', targets.map(t => ({type:t.type,url:t.url,title:t.title})))
    process.exit(3)
  }

  const client = await CDP({ host: '127.0.0.1', port: 9223, target: target.id })
  const { Page, Runtime } = client
  try {
    await Promise.all([Page.enable(), Runtime.enable()])
    const manifest = await Page.getAppManifest()
    const installability = await Page.getInstallabilityErrors()
    const appId = await Page.getAppId().catch((error) => ({ error: String(error) }))
    const icons = await Page.getManifestIcons().catch((error) => ({ error: String(error) }))
    const runtime = await Runtime.evaluate({
      expression: `JSON.stringify({
        url: location.href,
        secureContext: isSecureContext,
        standalone: matchMedia('(display-mode: standalone)').matches,
        serviceWorkerSupported: 'serviceWorker' in navigator,
        serviceWorkerController: Boolean(navigator.serviceWorker && navigator.serviceWorker.controller),
        beforeInstallPromptCached: Boolean(window.__trackdashInstallPrompt),
        userAgent: navigator.userAgent
      })`,
      returnByValue: true,
    })

    console.log('TRACKDASH_ANDROID_CDP_START')
    console.log(JSON.stringify({
      target: { id: target.id, url: target.url, title: target.title },
      manifest: {
        url: manifest.url,
        errors: manifest.errors,
        data: manifest.data ? JSON.parse(manifest.data) : null,
        parsed: manifest.manifest ?? null,
      },
      installability,
      appId,
      hasPrimaryIcon: Boolean(icons && icons.primaryIcon),
      manifestIconsError: icons && icons.error ? icons.error : null,
      runtime: runtime.result && runtime.result.value ? JSON.parse(runtime.result.value) : null,
    }, null, 2))
    console.log('TRACKDASH_ANDROID_CDP_END')
  } finally {
    await client.close()
  }
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
NODE

adb exec-out screencap -p > /tmp/trackdash-android.png || true

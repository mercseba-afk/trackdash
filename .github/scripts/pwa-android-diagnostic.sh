#!/usr/bin/env bash
set -euo pipefail

TARGET_ORIGIN="${TARGET_ORIGIN:-https://trackdash.it}"
TARGET_HOST="${TARGET_ORIGIN#https://}"
TARGET_HOST="${TARGET_HOST%%/*}"
export TARGET_ORIGIN TARGET_HOST
echo "=== TARGET ORIGIN: $TARGET_ORIGIN ==="

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
  adb shell am start -a android.intent.action.VIEW -d "${TARGET_ORIGIN}/?android-diag=fre-$attempt" com.android.chrome || true
  sleep 5
done

echo '=== INITIAL CHROME UI ==='
dump_ui

# Chrome's first-run UI can appear several seconds after the VIEW intent.
# Poll until the normal toolbar exists instead of assuming the first dump is final.
chrome_ready=0
for round in $(seq 1 20); do
  dump_ui >/tmp/chrome-fre-ui.txt

  if grep -q 'com.android.chrome:id/url_bar' /tmp/window.xml 2>/dev/null; then
    chrome_ready=1
    echo "Chrome main UI ready on round $round"
    break
  fi

  handled=0
  for label in 'Use without an account' 'Accept & continue' 'No thanks' 'Got it'; do
    if tap_matching_text "$label"; then
      handled=1
      echo "Handled Chrome first-run control: $label"
      sleep 3
      break
    fi
  done

  if [ "$handled" -eq 0 ]; then
    echo "Waiting for Chrome first-run UI (round $round)"
    sleep 3
  fi
done

if [ "$chrome_ready" -ne 1 ]; then
  echo 'CHROME_FIRST_RUN_DID_NOT_COMPLETE'
  dump_ui
  exit 4
fi

# Open TrackDash again only after the first-run experience is cleared.
adb shell am start -a android.intent.action.VIEW -d "${TARGET_ORIGIN}/?android-diag=ready" com.android.chrome
sleep 15

echo '=== ANDROID CHROME ENGAGEMENT GATE ==='
# Chrome's beforeinstallprompt promotion requires at least one page gesture and
# roughly 30 seconds of engagement. Tap inert hero copy, then wait beyond the
# documented threshold before inspecting the install state.
adb shell input tap 540 1300
sleep 35

echo '=== RELOAD AFTER ENGAGEMENT ==='
adb shell am start -a android.intent.action.VIEW -d "${TARGET_ORIGIN}/?android-diag=post-engagement" com.android.chrome
sleep 12

echo '=== TRACKDASH CHROME UI ==='
dump_ui

echo '=== SATISFY CHROME INSTALL ENGAGEMENT ==='
# A trusted tap on non-interactive hero text plus >30s viewing time satisfies
# Chrome's documented beforeinstallprompt engagement heuristic.
if [ "$TARGET_HOST" = "squoosh.app" ]; then
  adb shell input tap 540 1800
else
  adb shell input tap 500 1000
fi
sleep 35
echo '=== TRACKDASH UI AFTER ENGAGEMENT ==='
dump_ui

if [ "$TARGET_HOST" = "squoosh.app" ]; then
  # Squoosh can immediately ask Chrome for camera permission. Dismiss it so it
  # cannot obscure the page's own Install control or Chrome's install UI.
  for round in 1 2 3; do
    dump_ui >/tmp/squoosh-permission-ui.txt
    if tap_matching_text "Don’t allow" || tap_matching_text "Don't allow"; then
      echo 'SQUOOSH_PERMISSION_DISMISSED'
      sleep 2
    else
      break
    fi
  done
  dump_ui >/tmp/squoosh-ready-ui.txt
fi

adb logcat -c || true

if [ "$TARGET_HOST" = "squoosh.app" ]; then
  echo '=== SQUOOSH CHROME INSTALL MENU CONTROL ==='
  MENU_BOUNDS="$(python3 - <<'PY'
import re, xml.etree.ElementTree as ET
root=ET.parse('/tmp/window.xml').getroot()
for node in root.iter('node'):
    if node.attrib.get('resource-id') == 'com.android.chrome:id/menu_button':
        m=re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds',''))
        if m:
            x1,y1,x2,y2=map(int,m.groups())
            print(f"{(x1+x2)//2},{(y1+y2)//2}")
            break
PY
)"
  if [ -n "$MENU_BOUNDS" ]; then
    adb shell input tap "${MENU_BOUNDS%,*}" "${MENU_BOUNDS#*,}"
    sleep 2
    dump_ui >/tmp/squoosh-chrome-menu-ui.txt
    echo '=== SQUOOSH CHROME MENU ITEMS ==='
    python3 - <<'PY'
import xml.etree.ElementTree as ET
root=ET.parse('/tmp/window.xml').getroot()
seen=set()
for node in root.iter('node'):
    text=(node.attrib.get('text') or '').strip()
    desc=(node.attrib.get('content-desc') or '').strip()
    value=text or desc
    if value and value not in seen:
        seen.add(value)
        print(value)
PY

    installed=0
    for label in 'Install app' 'Install Squoosh' 'Install'; do
      if tap_matching_text "$label"; then
        echo "SQUOOSH_MENU_INSTALL_TAPPED: $label"
        sleep 3
        dump_ui >/tmp/squoosh-install-dialog-ui.txt
        echo '=== SQUOOSH INSTALL DIALOG ==='
        python3 - <<'PY'
import xml.etree.ElementTree as ET
root=ET.parse('/tmp/window.xml').getroot()
seen=set()
for node in root.iter('node'):
    text=(node.attrib.get('text') or '').strip()
    desc=(node.attrib.get('content-desc') or '').strip()
    value=text or desc
    if value and value not in seen:
        seen.add(value)
        print(value)
PY
        for confirm in 'Install' 'Add'; do
          if tap_matching_text "$confirm"; then
            echo "SQUOOSH_NATIVE_INSTALL_CONFIRMED: $confirm"
            installed=1
            break
          fi
        done
        break
      fi
    done

    if [ "$installed" -eq 1 ]; then
      sleep 20
      echo '=== SQUOOSH WEBAPK PACKAGES AFTER INSTALL ==='
      adb shell pm list packages | grep -Ei 'webapk|squoosh' || true
      adb shell pm list packages -3 | grep -Ei 'webapk|squoosh' || true
    else
      echo 'SQUOOSH_NO_NATIVE_INSTALL_MENU_ITEM'
      adb shell input keyevent 4 || true
    fi
  else
    echo 'SQUOOSH_CHROME_MENU_BUTTON_NOT_FOUND'
  fi
else
echo '=== CHROME INSTALL MENU ==='
MENU_BOUNDS="$(python3 - <<'PY'
import re, xml.etree.ElementTree as ET
root=ET.parse('/tmp/window.xml').getroot()
for node in root.iter('node'):
    if node.attrib.get('resource-id') == 'com.android.chrome:id/menu_button':
        m=re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds',''))
        if m:
            x1,y1,x2,y2=map(int,m.groups())
            print(f"{(x1+x2)//2},{(y1+y2)//2}")
            break
PY
)"
if [ -n "$MENU_BOUNDS" ]; then
  adb shell input tap "${MENU_BOUNDS%,*}" "${MENU_BOUNDS#*,}"
  sleep 2
  dump_ui >/tmp/chrome-menu-ui.txt
  python3 - <<'PY'
import xml.etree.ElementTree as ET
root=ET.parse('/tmp/window.xml').getroot()
seen=set()
for node in root.iter('node'):
    text=(node.attrib.get('text') or '').strip()
    desc=(node.attrib.get('content-desc') or '').strip()
    value=text or desc
    if value and value not in seen:
        seen.add(value)
        print(value)
PY

  echo '=== OPEN ADD TO HOME SCREEN ==='
  if tap_matching_text "Add to Home screen"; then
    sleep 3
    dump_ui >/tmp/a2hs-dialog-ui.txt
    python3 - <<'PY'
import xml.etree.ElementTree as ET
root=ET.parse('/tmp/window.xml').getroot()
seen=set()
for node in root.iter('node'):
    text=(node.attrib.get('text') or '').strip()
    desc=(node.attrib.get('content-desc') or '').strip()
    value=text or desc
    if value and value not in seen:
        seen.add(value)
        print(value)
PY

    echo '=== CONFIRM A2HS/INSTALL ==='
    confirmed=0
    for label in 'Install' 'Add to Home screen' 'Add'; do
      if tap_matching_text "$label"; then
        confirmed=1
        echo "Confirmed with: $label"
        break
      fi
    done

    if [ "$confirmed" -eq 1 ]; then
      sleep 15
      echo '=== WEBAPK PACKAGES AFTER INSTALL ==='
      adb shell pm list packages | grep -Ei 'webapk|trackdash' || true
      adb shell pm list packages -3 | grep -Ei 'webapk|trackdash' || true

      echo '=== LAUNCHER AFTER INSTALL ==='
      adb shell input keyevent 3
      sleep 3
      dump_ui >/tmp/launcher-after-install.txt
      python3 - <<'PY'
import xml.etree.ElementTree as ET
root=ET.parse('/tmp/window.xml').getroot()
for node in root.iter('node'):
    text=(node.attrib.get('text') or '').strip()
    desc=(node.attrib.get('content-desc') or '').strip()
    if 'trackdash' in (text + ' ' + desc).lower():
        print('TRACKDASH_LAUNCHER_NODE', node.attrib)
PY

      WEBAPK_PACKAGE="$(adb shell pm list packages | sed 's/^package://' | grep -Ei 'webapk|trackdash' | head -1 | tr -d '\r' || true)"
      if [ -n "$WEBAPK_PACKAGE" ]; then
        echo "=== LAUNCH INSTALLED PACKAGE: $WEBAPK_PACKAGE ==="
        adb shell monkey -p "$WEBAPK_PACKAGE" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
        sleep 8
        dump_ui >/tmp/installed-app-ui.txt
        python3 - <<'PY'
import xml.etree.ElementTree as ET
root=ET.parse('/tmp/window.xml').getroot()
ids=[]
texts=[]
for node in root.iter('node'):
    rid=node.attrib.get('resource-id') or ''
    if rid:
        ids.append(rid)
    text=(node.attrib.get('text') or '').strip()
    if text:
        texts.append(text)
print('HAS_CHROME_URL_BAR', any('url_bar' in x for x in ids))
print('HAS_CHROME_TOOLBAR', any('toolbar' in x and 'chrome' in x for x in ids))
print('VISIBLE_TEXT_SAMPLE', texts[:25])
PY
      else
        echo 'NO_WEBAPK_PACKAGE_FOUND'
      fi
    else
      echo 'NO_CONFIRM_BUTTON_FOUND'
    fi
  else
    echo 'ADD_TO_HOME_SCREEN_MENU_ITEM_NOT_FOUND'
    adb shell input keyevent 4
  fi
else
  echo 'CHROME_MENU_BUTTON_NOT_FOUND'
fi

fi

echo '=== WEBAPK/INSTALL LOGCAT ==='
adb logcat -d | grep -Ei 'webapk|add.?to.?home|installable|shortcut' | tail -200 || true

# Return to the TrackDash browser tab before CDP inspection.
adb shell am start -a android.intent.action.VIEW -d "${TARGET_ORIGIN}/?android-diag=cdp" com.android.chrome
sleep 8

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

node <<'NODE'
const fs = require('node:fs')

const targets = JSON.parse(fs.readFileSync('/tmp/android-chrome-tabs.json', 'utf8'))
const target = targets.find((t) => t.type === 'page' && t.url.includes(process.env.TARGET_HOST || 'trackdash.it'))
if (!target) {
  console.error('NO_TRACKDASH_TARGET', targets.map(t => ({type:t.type,url:t.url,title:t.title})))
  process.exit(3)
}

const ws = new WebSocket(target.webSocketDebuggerUrl)
let nextId = 1
const pending = new Map()

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`CDP timeout: ${method}`))
    }, 12000)
    pending.set(id, { resolve, reject, timer, method })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

ws.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data))
  if (!message.id || !pending.has(message.id)) return
  const item = pending.get(message.id)
  pending.delete(message.id)
  clearTimeout(item.timer)
  if (message.error) item.reject(new Error(`${item.method}: ${message.error.message}`))
  else item.resolve(message.result)
})

ws.addEventListener('close', () => {
  for (const item of pending.values()) {
    clearTimeout(item.timer)
    item.reject(new Error(`CDP socket closed during ${item.method}`))
  }
  pending.clear()
})

;(async () => {
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  await call('Page.enable')
  await call('Runtime.enable')

  const manifest = await call('Page.getAppManifest')
  const installability = await call('Page.getInstallabilityErrors').catch((error) => ({ error: String(error) }))
  const appId = await call('Page.getAppId').catch((error) => ({ error: String(error) }))
  const icons = await call('Page.getManifestIcons').catch((error) => ({ error: String(error) }))
  const runtime = await call('Runtime.evaluate', {
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
  ws.close()
})().catch((error) => {
  console.error(error)
  try { ws.close() } catch {}
  process.exit(1)
})
NODE

adb exec-out screencap -p > /tmp/trackdash-android.png || true

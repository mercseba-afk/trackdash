# TrackDash PWA installation notes

TrackDash must distinguish a real installed PWA/WebAPK from a plain browser shortcut.

On Android Chrome, the real app should launch with the manifest `display: standalone` behavior and use the TrackDash manifest icon. A browser shortcut that opens with an address bar is not considered a successful TrackDash app installation.

The install flow uses `beforeinstallprompt` when available and `navigator.getInstalledRelatedApps()` when supported to detect an already-installed TrackDash PWA before offering fallback guidance.

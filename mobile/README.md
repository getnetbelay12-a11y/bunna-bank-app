# Mobile

Flutter app workspace for member-facing banking features including savings, loans, payments, notifications, and shareholder voting.

## Runtime Config
- Set `API_BASE_URL` with `--dart-define` to enable real backend HTTP calls
- Debug builds can fall back to demo data adapters
- Release builds should set `API_BASE_URL`; demo mode is disabled by default unless you explicitly pass `--dart-define=APP_DEMO_MODE=true`

Example:
```bash
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:4008
```

Explicit local demo mode:
```bash
flutter run --dart-define=APP_DEMO_MODE=true
```

Platform notes:
- iOS simulator and desktop: `http://127.0.0.1:4008`
- Android emulator: `http://10.0.2.2:4008`
- Physical device: `http://YOUR_MAC_LOCAL_IP:4008`

## Android Release Signing

- Add `mobile/android/key.properties` for Android release signing.
- Release builds no longer fall back to the debug signing key.

## macOS Build Note

Do not symlink `build/` to `/tmp` or `/private/tmp` for macOS runs. On Xcode 26.2 this causes module-cache and stale-file failures because the build products resolve outside Xcode's allowed root paths.

Use the default in-repo `build/` directory, or if you need a different location, use a real directory under the workspace instead of a symlink.

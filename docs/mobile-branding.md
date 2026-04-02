# Mobile Branding

## Current Flutter logo asset

- The shared mobile logo asset is `mobile/assets/images/cbe-bank-logo.png`.
- `mobile/pubspec.yaml` registers the asset as `assets/images/cbe-bank-logo.png`.
- The reusable widget is `mobile/lib/widgets/cbe_bank_logo.dart`.

## Generate app icons later

When the app icon is ready to be generated, use `flutter_launcher_icons`.

1. Add the package to `dev_dependencies` in `mobile/pubspec.yaml`.
2. Add a `flutter_launcher_icons` section that points to `assets/images/cbe-bank-logo.png`.
3. Run `flutter pub get`.
4. Run `dart run flutter_launcher_icons`.

Example configuration:

```yaml
dev_dependencies:
  flutter_launcher_icons: ^0.14.3

flutter_launcher_icons:
  android: true
  ios: true
  image_path: assets/images/cbe-bank-logo.png
  adaptive_icon_background: "#1F6F54"
```

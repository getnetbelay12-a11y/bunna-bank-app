import AppKit
import Foundation

struct IconSpec {
  let path: String
  let size: Int
  let backgroundColor: NSColor?
}

enum IconGeneratorError: Error {
  case failedToLoadImage(String)
  case failedToCropImage
  case failedToCreateBitmap(Int)
  case failedToEncodeImage(String)
}

let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let sourceURL = repoRoot.appendingPathComponent("assets/bunna_bank_logo.png")

guard let sourceImage = NSImage(contentsOf: sourceURL) else {
  throw IconGeneratorError.failedToLoadImage(sourceURL.path)
}

var sourceRect = NSRect(origin: .zero, size: sourceImage.size)
guard
  let sourceCG = sourceImage.cgImage(forProposedRect: &sourceRect, context: nil, hints: nil)
else {
  throw IconGeneratorError.failedToLoadImage(sourceURL.path)
}

let emblemCrop = CGRect(x: 0, y: 0, width: min(141, sourceCG.width), height: min(141, sourceCG.height))
guard let emblemCG = sourceCG.cropping(to: emblemCrop) else {
  throw IconGeneratorError.failedToCropImage
}

func writePNG(
  emblem: CGImage,
  to destinationURL: URL,
  canvasSize: Int,
  insetRatio: CGFloat,
  backgroundColor: NSColor?
) throws {
  let pixelsWide = canvasSize
  let pixelsHigh = canvasSize

  guard
    let bitmap = NSBitmapImageRep(
      bitmapDataPlanes: nil,
      pixelsWide: pixelsWide,
      pixelsHigh: pixelsHigh,
      bitsPerSample: 8,
      samplesPerPixel: 4,
      hasAlpha: true,
      isPlanar: false,
      colorSpaceName: .deviceRGB,
      bytesPerRow: 0,
      bitsPerPixel: 32
    )
  else {
    throw IconGeneratorError.failedToCreateBitmap(canvasSize)
  }

  NSGraphicsContext.saveGraphicsState()
  guard let graphicsContext = NSGraphicsContext(bitmapImageRep: bitmap) else {
    throw IconGeneratorError.failedToCreateBitmap(canvasSize)
  }

  NSGraphicsContext.current = graphicsContext

  let canvasRect = NSRect(x: 0, y: 0, width: canvasSize, height: canvasSize)
  if let backgroundColor {
    backgroundColor.setFill()
    canvasRect.fill()
  } else {
    NSColor.clear.setFill()
    canvasRect.fill()
  }

  let inset = CGFloat(canvasSize) * insetRatio
  let drawRect = canvasRect.insetBy(dx: inset, dy: inset)
  NSImage(cgImage: emblem, size: NSSize(width: emblem.width, height: emblem.height))
    .draw(in: drawRect)

  NSGraphicsContext.restoreGraphicsState()

  guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
    throw IconGeneratorError.failedToEncodeImage(destinationURL.path)
  }

  try FileManager.default.createDirectory(
    at: destinationURL.deletingLastPathComponent(),
    withIntermediateDirectories: true
  )
  try pngData.write(to: destinationURL)
}

let legacyAndroidIcons = [
  IconSpec(path: "mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher.png", size: 48, backgroundColor: .white),
  IconSpec(path: "mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png", size: 48, backgroundColor: .white),
  IconSpec(path: "mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher.png", size: 72, backgroundColor: .white),
  IconSpec(path: "mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png", size: 72, backgroundColor: .white),
  IconSpec(path: "mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png", size: 96, backgroundColor: .white),
  IconSpec(path: "mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png", size: 96, backgroundColor: .white),
  IconSpec(path: "mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png", size: 144, backgroundColor: .white),
  IconSpec(path: "mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png", size: 144, backgroundColor: .white),
  IconSpec(path: "mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png", size: 192, backgroundColor: .white),
  IconSpec(path: "mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png", size: 192, backgroundColor: .white),
]

let iosIcons = [
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@1x.png", size: 20, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@2x.png", size: 40, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@3x.png", size: 60, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@1x.png", size: 29, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@2x.png", size: 58, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@3x.png", size: 87, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@1x.png", size: 40, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@2x.png", size: 80, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@3x.png", size: 120, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@2x.png", size: 120, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@3x.png", size: 180, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-76x76@1x.png", size: 76, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-76x76@2x.png", size: 152, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-83.5x83.5@2x.png", size: 167, backgroundColor: .white),
  IconSpec(path: "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png", size: 1024, backgroundColor: .white),
]

let adaptiveForeground = IconSpec(
  path: "mobile/android/app/src/main/res/drawable/ic_launcher_foreground.png",
  size: 432,
  backgroundColor: nil
)

for spec in legacyAndroidIcons + iosIcons {
  let destinationURL = repoRoot.appendingPathComponent(spec.path)
  try writePNG(
    emblem: emblemCG,
    to: destinationURL,
    canvasSize: spec.size,
    insetRatio: 0.14,
    backgroundColor: spec.backgroundColor
  )
}

try writePNG(
  emblem: emblemCG,
  to: repoRoot.appendingPathComponent(adaptiveForeground.path),
  canvasSize: adaptiveForeground.size,
  insetRatio: 0.18,
  backgroundColor: adaptiveForeground.backgroundColor
)

print("Generated Bunna Bank Android and iOS app icons from \(sourceURL.path)")

#!/bin/bash

# Modern iOS 26 App Build Script
# Built with Xcode 26, Swift 6, and iOS 26

echo "🚀 Building Modern iOS 26 App..."
echo "📱 Target: iOS 26"
echo "🛠️  Xcode: 26"
echo "⚡ Swift: 6.0"
echo ""

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed or not in PATH"
    exit 1
fi

# Check Xcode version
XCODE_VERSION=$(xcodebuild -version | head -n 1)
echo "🔍 Detected: $XCODE_VERSION"

# Clean build folder
echo "🧹 Cleaning build folder..."
rm -rf build/

# Create build directory
mkdir -p build

# Build for iOS Simulator
echo "📱 Building for iOS Simulator..."
xcodebuild \
    -project ModerniOS26App.xcodeproj \
    -scheme ModerniOS26App \
    -destination 'platform=iOS Simulator,name=iPhone 15 Pro,OS=latest' \
    -configuration Debug \
    -derivedDataPath build/DerivedData \
    build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🎉 Modern iOS 26 App is ready to run!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Open ModerniOS26App.xcworkspace in Xcode 26"
    echo "   2. Select your target device or simulator"
    echo "   3. Press Cmd+R to build and run"
    echo "   4. Experience the Liquid Glass UI and AI features!"
    echo ""
    echo "🌟 Features included:"
    echo "   • Liquid Glass design language"
    echo "   • AI integration capabilities"
    echo "   • Voice control support"
    echo "   • Swift 6 concurrency"
    echo "   • Modern SwiftUI interface"
else
    echo "❌ Build failed!"
    echo "🔧 Please check the error messages above"
    exit 1
fi
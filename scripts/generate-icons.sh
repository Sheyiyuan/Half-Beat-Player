#!/bin/bash
# Generate platform-specific icons from PNG source
# Usage: scripts/generate-icons.sh [platform]
# Platforms: windows, all (default: all)

set -euo pipefail

PLATFORM=${1:-all}
SOURCE_PNG="assets/icons/appicon-256.png"

if [[ ! -f "$SOURCE_PNG" ]]; then
    echo "Error: Source PNG not found: $SOURCE_PNG" >&2
    exit 1
fi

generate_windows_ico() {
    echo "Generating Windows ICO file..."
    mkdir -p build/windows
    
    if command -v convert >/dev/null 2>&1; then
        # Use ImageMagick to create comprehensive multi-resolution ICO file
        echo "Using ImageMagick to generate comprehensive multi-resolution ICO..."
        convert "$SOURCE_PNG" \
            \( -clone 0 -resize 16x16 \) \
            \( -clone 0 -resize 20x20 \) \
            \( -clone 0 -resize 24x24 \) \
            \( -clone 0 -resize 32x32 \) \
            \( -clone 0 -resize 40x40 \) \
            \( -clone 0 -resize 48x48 \) \
            \( -clone 0 -resize 64x64 \) \
            \( -clone 0 -resize 96x96 \) \
            \( -clone 0 -resize 128x128 \) \
            \( -clone 0 -resize 256x256 \) \
            -delete 0 build/windows/icon.ico
        echo "✓ Generated build/windows/icon.ico with comprehensive resolutions:"
        echo "  Small icons: 16x16, 20x20, 24x24"
        echo "  Medium icons: 32x32, 40x40, 48x48, 64x64"
        echo "  Large icons: 96x96, 128x128, 256x256"
        
        # Verify the generated ICO file
        if command -v identify >/dev/null 2>&1; then
            echo "ICO file info:"
            identify build/windows/icon.ico || true
        fi
        
    elif command -v icotool >/dev/null 2>&1; then
        # Fallback to icotool - generate multiple sizes manually
        echo "Using icotool to generate multi-resolution ICO..."
        
        # Create temporary directory for individual icons
        TEMP_DIR=$(mktemp -d)
        trap "rm -rf $TEMP_DIR" EXIT
        
        # Generate individual PNG files for each size
        for size in 16 20 24 32 40 48 64 96 128 256; do
            if command -v convert >/dev/null 2>&1; then
                convert "$SOURCE_PNG" -resize ${size}x${size} "$TEMP_DIR/icon_${size}.png"
            else
                # If no convert, just copy the original for the largest size
                if [[ $size -eq 256 ]]; then
                    cp "$SOURCE_PNG" "$TEMP_DIR/icon_${size}.png"
                else
                    echo "Warning: Cannot resize without ImageMagick, skipping ${size}x${size}"
                    continue
                fi
            fi
        done
        
        # Combine all sizes into ICO file
        icotool -c -o build/windows/icon.ico "$TEMP_DIR"/icon_*.png
        echo "✓ Generated build/windows/icon.ico using icotool with available resolutions"
        
    else
        echo "Warning: Neither ImageMagick nor icotool found"
        echo "Available tools for ICO generation:"
        echo "  - ImageMagick: sudo apt install imagemagick"
        echo "  - icoutils: sudo apt install icoutils"
        echo "Copying PNG as fallback (may not work properly)..."
        cp "$SOURCE_PNG" build/windows/icon.ico
        echo "⚠ Copied PNG as build/windows/icon.ico (fallback)"
    fi
}

case "$PLATFORM" in
    windows)
        generate_windows_ico
        ;;
    all)
        generate_windows_ico
        ;;
    *)
        echo "Unknown platform: $PLATFORM" >&2
        echo "Supported platforms: windows, all" >&2
        exit 1
        ;;
esac

echo "Icon generation completed for platform: $PLATFORM"
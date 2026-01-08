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
        
        # Generate all required Windows icon sizes with optimal quality
        # Using the most comprehensive Windows icon size matrix
        convert "$SOURCE_PNG" \
            \( -clone 0 -resize 16x16 -colors 256 \) \
            \( -clone 0 -resize 20x20 -colors 256 \) \
            \( -clone 0 -resize 24x24 -colors 256 \) \
            \( -clone 0 -resize 32x32 -colors 256 \) \
            \( -clone 0 -resize 40x40 -colors 256 \) \
            \( -clone 0 -resize 48x48 -colors 256 \) \
            \( -clone 0 -resize 64x64 -colors 256 \) \
            \( -clone 0 -resize 72x72 -colors 256 \) \
            \( -clone 0 -resize 96x96 -colors 256 \) \
            \( -clone 0 -resize 128x128 -colors 256 \) \
            \( -clone 0 -resize 256x256 \) \
            -delete 0 -compress None -background transparent build/windows/icon.ico
            
        echo "✓ Generated build/windows/icon.ico with optimized Windows icon sizes:"
        echo "  Standard sizes: 16x16, 20x20, 24x24, 32x32, 40x40, 48x48"
        echo "  Large sizes: 64x64, 72x72, 96x96, 128x128, 256x256"
        echo "  Optimized for: taskbar, system tray, file explorer, Alt+Tab"
        
        # Verify the generated ICO file
        if command -v identify >/dev/null 2>&1; then
            echo "ICO file info:"
            identify build/windows/icon.ico || true
            echo ""
            echo "File size: $(ls -lh build/windows/icon.ico | awk '{print $5}')"
        fi
        
    elif command -v icotool >/dev/null 2>&1; then
        # Fallback to icotool - generate multiple sizes manually
        echo "Using icotool to generate multi-resolution ICO..."
        
        # Create temporary directory for individual icons
        TEMP_DIR=$(mktemp -d)
        trap "rm -rf $TEMP_DIR" EXIT
        
        # Generate individual PNG files for each size with optimal quality
        sizes=(16 20 24 32 40 48 64 72 96 128 256)
        
        for size in "${sizes[@]}"; do
            if command -v convert >/dev/null 2>&1; then
                convert "$SOURCE_PNG" -resize ${size}x${size} -colors 256 -background transparent "$TEMP_DIR/icon_${size}.png"
            else
                # If no convert, just copy the original for the largest sizes
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
        echo "✓ Generated build/windows/icon.ico using icotool with optimized resolutions"
        
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
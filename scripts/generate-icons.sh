#!/bin/bash
# Generate platform-specific icons from PNG source
# Usage: scripts/generate-icons.sh [platform]
# Platforms: windows, darwin/macos, all (default: all)

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
        # Use ImageMagick auto-resize feature for optimal ICO generation
        echo "Using ImageMagick auto-resize for clean multi-resolution ICO..."
        
        convert "$SOURCE_PNG" -define icon:auto-resize=256,128,64,48,32,16 build/windows/icon.ico
        
        echo "✓ Generated build/windows/icon.ico with auto-resized resolutions:"
        echo "  Sizes: 256x256(PNG), 128x128, 64x64, 48x48, 32x32, 16x16"
        echo "  Optimized for all Windows display scenarios"
        
        # Verify the generated ICO file
        if command -v identify >/dev/null 2>&1; then
            echo "ICO file info:"
            identify build/windows/icon.ico || true
            echo ""
            echo "File size: $(ls -lh build/windows/icon.ico | awk '{print $5}')"
        fi
        
    elif command -v icotool >/dev/null 2>&1; then
        # Fallback to icotool - generate standard sizes
        echo "Using icotool for ICO generation..."
        
        # Create temporary directory for individual icons
        TEMP_DIR=$(mktemp -d)
        trap "rm -rf $TEMP_DIR" EXIT
        
        # Generate standard Windows icon sizes
        sizes=(16 32 48 64 128 256)
        
        for size in "${sizes[@]}"; do
            if command -v convert >/dev/null 2>&1; then
                convert "$SOURCE_PNG" -resize ${size}x${size} -background transparent "$TEMP_DIR/icon_${size}.png"
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
        echo "✓ Generated build/windows/icon.ico using icotool with standard resolutions"
        
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

generate_macos_icns() {
    echo "Generating macOS ICNS file..."
    mkdir -p build/darwin
    
    if command -v iconutil >/dev/null 2>&1; then
        # Use macOS native iconutil (preferred on macOS)
        echo "Using iconutil to generate ICNS..."
        
        # Create iconset directory
        ICONSET_DIR="build/darwin/icon.iconset"
        mkdir -p "$ICONSET_DIR"
        
        # Generate all required macOS icon sizes using simple arrays
        # Define filenames and corresponding sizes
        filenames=(
            "icon_16x16.png"
            "icon_16x16@2x.png"
            "icon_32x32.png"
            "icon_32x32@2x.png"
            "icon_128x128.png"
            "icon_128x128@2x.png"
            "icon_256x256.png"
            "icon_256x256@2x.png"
            "icon_512x512.png"
            "icon_512x512@2x.png"
        )
        
        sizes=(
            "16"
            "32"
            "32"
            "64"
            "128"
            "256"
            "256"
            "512"
            "512"
            "1024"
        )
        
        # Generate icons for each size
        for i in "${!filenames[@]}"; do
            filename="${filenames[$i]}"
            size="${sizes[$i]}"
            
            # Validate size is numeric
            if [[ ! "$size" =~ ^[0-9]+$ ]]; then
                echo "Warning: Invalid size '$size' for $filename, skipping"
                continue
            fi
            
            if command -v sips >/dev/null 2>&1; then
                # Use sips (macOS native)
                if ! sips -z "$size" "$size" "$SOURCE_PNG" --out "$ICONSET_DIR/$filename" >/dev/null 2>&1; then
                    echo "Warning: Failed to generate $filename with sips"
                fi
            elif command -v convert >/dev/null 2>&1; then
                # Fallback to ImageMagick
                if ! convert "$SOURCE_PNG" -resize "${size}x${size}" "$ICONSET_DIR/$filename" 2>/dev/null; then
                    echo "Warning: Failed to generate $filename with convert"
                fi
            else
                echo "Warning: Neither sips nor convert available, skipping $filename"
                continue
            fi
        done
        
        # Verify we have at least some icons before generating ICNS
        icon_count=$(find "$ICONSET_DIR" -name "*.png" 2>/dev/null | wc -l)
        if [[ "$icon_count" -eq 0 ]]; then
            echo "Error: No icons were generated for iconset"
            rm -rf "$ICONSET_DIR"
            return 1
        fi
        
        # Generate ICNS file
        if iconutil -c icns "$ICONSET_DIR" -o build/darwin/icon.icns 2>/dev/null; then
            rm -rf "$ICONSET_DIR"
            echo "✓ Generated build/darwin/icon.icns with native iconutil"
            echo "  Sizes: 16x16, 32x32, 128x128, 256x256, 512x512 (including @2x variants)"
        else
            echo "Error: Failed to generate ICNS file with iconutil"
            rm -rf "$ICONSET_DIR"
            return 1
        fi
        
    elif command -v convert >/dev/null 2>&1 && command -v png2icns >/dev/null 2>&1; then
        # Use ImageMagick + png2icns
        echo "Using ImageMagick + png2icns for ICNS generation..."
        
        # Create temporary directory for individual icons
        TEMP_DIR=$(mktemp -d)
        trap "rm -rf $TEMP_DIR" EXIT
        
        # Generate standard macOS icon sizes
        sizes=(16 32 64 128 256 512 1024)
        
        for size in "${sizes[@]}"; do
            # Validate size is numeric
            if [[ ! "$size" =~ ^[0-9]+$ ]]; then
                echo "Warning: Invalid size '$size', skipping"
                continue
            fi
            
            if ! convert "$SOURCE_PNG" -resize "${size}x${size}" -background transparent "$TEMP_DIR/icon_${size}.png" 2>/dev/null; then
                echo "Warning: Failed to generate ${size}x${size} icon"
            fi
        done
        
        # Verify we have at least some icons
        icon_count=$(find "$TEMP_DIR" -name "icon_*.png" 2>/dev/null | wc -l)
        if [[ "$icon_count" -eq 0 ]]; then
            echo "Error: No icons were generated for png2icns"
            return 1
        fi
        
        # Convert to ICNS
        if png2icns build/darwin/icon.icns "$TEMP_DIR"/icon_*.png 2>/dev/null; then
            echo "✓ Generated build/darwin/icon.icns using png2icns"
        else
            echo "Error: Failed to generate ICNS file with png2icns"
            return 1
        fi
        
    elif command -v convert >/dev/null 2>&1; then
        # ImageMagick only (may not produce proper ICNS)
        echo "Using ImageMagick for ICNS generation (limited compatibility)..."
        if convert "$SOURCE_PNG" -define icon:auto-resize=512,256,128,64,32,16 build/darwin/icon.icns 2>/dev/null; then
            echo "⚠ Generated build/darwin/icon.icns using ImageMagick (may have limited compatibility)"
        else
            echo "Error: Failed to generate ICNS file with ImageMagick"
            return 1
        fi
        
    else
        echo "Warning: No suitable tools found for ICNS generation"
        echo "Available tools for macOS ICNS generation:"
        echo "  - iconutil (macOS native, preferred)"
        echo "  - png2icns: brew install libicns"
        echo "  - ImageMagick: brew install imagemagick"
        echo "Copying PNG as fallback (may not work properly)..."
        if ! cp "$SOURCE_PNG" build/darwin/icon.icns 2>/dev/null; then
            echo "Error: Failed to copy PNG as fallback"
            return 1
        fi
        echo "⚠ Copied PNG as build/darwin/icon.icns (fallback)"
    fi
    
    # Verify the generated ICNS file exists and is not empty
    if [[ ! -f build/darwin/icon.icns ]]; then
        echo "Error: ICNS file was not created"
        return 1
    fi
    
    if [[ ! -s build/darwin/icon.icns ]]; then
        echo "Error: ICNS file is empty"
        return 1
    fi
    
    echo "ICNS file size: $(ls -lh build/darwin/icon.icns | awk '{print $5}')"
    if command -v file >/dev/null 2>&1; then
        file build/darwin/icon.icns
    fi
}

case "$PLATFORM" in
    windows)
        generate_windows_ico
        ;;
    darwin|macos)
        generate_macos_icns
        ;;
    all)
        generate_windows_ico
        generate_macos_icns
        ;;
    *)
        echo "Unknown platform: $PLATFORM" >&2
        echo "Supported platforms: windows, darwin/macos, all" >&2
        exit 1
        ;;
esac

echo "Icon generation completed for platform: $PLATFORM"
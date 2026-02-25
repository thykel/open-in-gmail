#!/bin/bash

# Package script for Open in Gmail extension
# Creates a .xpi file (which is just a renamed zip file)

set -e

EXTENSION_NAME="open-in-gmail"
VERSION="1.0.0"
OUTPUT_FILE="${EXTENSION_NAME}.xpi"

echo "Packaging ${EXTENSION_NAME} v${VERSION}..."

# Remove old package if it exists
if [ -f "${OUTPUT_FILE}" ]; then
    echo "Removing old package..."
    rm "${OUTPUT_FILE}"
fi

# Create the package
echo "Creating package..."
zip -r "${OUTPUT_FILE}" \
    manifest.json \
    background.js \
    icons/*.png \
    -x "*.DS_Store" \
    -x "__MACOSX/*"

# Verify the package
echo ""
echo "Package contents:"
unzip -l "${OUTPUT_FILE}"

echo ""
echo "✓ Package created successfully: ${OUTPUT_FILE}"
echo ""
echo "To install:"
echo "1. Open Thunderbird"
echo "2. Go to Tools > Add-ons and Themes (Cmd+Shift+A)"
echo "3. Click the gear icon and select 'Install Add-on From File...'"
echo "4. Select ${OUTPUT_FILE}"
echo ""

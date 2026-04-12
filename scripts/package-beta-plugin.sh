#!/bin/bash
# ─────────────────────────────────────────────────────────────
# package-beta-plugin.sh
# Run this after fixing a bug in eve-studio-plugin/ to package
# a new beta zip and drop it into the web app's public folder.
#
# Usage:
#   bash scripts/package-beta-plugin.sh
#
# After running:
#   1. Bump BETA_VERSION in src/app/api/plugin/version/route.ts
#   2. Bump "version" in ../eve-studio-plugin/manifest.json
#   3. Bump PLUGIN_VERSION in ../eve-studio-plugin/src/app.js
#   4. Deploy the web app
#   5. Beta users will see the update banner and re-download
# ─────────────────────────────────────────────────────────────

set -e

PLUGIN_DIR="../eve-studio-plugin"
OUTPUT_DIR="./public"
ZIP_NAME="eve-plugin.zip"

echo "Packaging beta plugin..."

# Confirm the plugin directory exists
if [ ! -d "$PLUGIN_DIR" ]; then
  echo "Error: $PLUGIN_DIR not found. Run this script from eve-studio/"
  exit 1
fi

# Remove old zip
rm -f "$OUTPUT_DIR/$ZIP_NAME"

# Package: include only the files the plugin needs
cd "$PLUGIN_DIR"
zip -r "../eve-studio/$OUTPUT_DIR/$ZIP_NAME" \
  manifest.json \
  index.html \
  styles.css \
  src/ \
  assets/ \
  --exclude "*.DS_Store" \
  --exclude "*__pycache__*" \
  --exclude "*.git*"

cd "../eve-studio"

echo ""
echo "Done — $OUTPUT_DIR/$ZIP_NAME updated."
echo ""
echo "Next steps:"
echo "  1. Bump BETA_VERSION in src/app/api/plugin/version/route.ts"
echo "  2. Bump version in $PLUGIN_DIR/manifest.json"
echo "  3. Bump PLUGIN_VERSION in $PLUGIN_DIR/src/app.js"
echo "  4. Commit + deploy"

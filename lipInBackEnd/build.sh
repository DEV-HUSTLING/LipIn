#!/usr/bin/env bash
# Render build script for Playwright

set -o errexit  # Exit on error

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Set Playwright browser path (must match render.yaml env var)
export PLAYWRIGHT_BROWSERS_PATH=/opt/render/project/src/ms-playwright

# Create the directory if it doesn't exist
mkdir -p $PLAYWRIGHT_BROWSERS_PATH

# Install Playwright browsers and system dependencies
playwright install --with-deps chromium

# Verify installation
echo "Playwright browsers installed at: $PLAYWRIGHT_BROWSERS_PATH"
ls -la $PLAYWRIGHT_BROWSERS_PATH

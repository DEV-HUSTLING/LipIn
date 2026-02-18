#!/usr/bin/env bash
# Render build script for Playwright

set -o errexit  # Exit on error

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Set Playwright browser path to project directory for persistence
export PLAYWRIGHT_BROWSERS_PATH=$PWD/ms-playwright

# Install Playwright browsers and system dependencies
playwright install --with-deps chromium

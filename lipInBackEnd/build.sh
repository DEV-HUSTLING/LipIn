#!/usr/bin/env bash
# Render build script for Playwright

set -o errexit  # Exit on error

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright browsers and system dependencies
playwright install --with-deps chromium

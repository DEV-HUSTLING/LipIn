#!/bin/bash
# Upload LinkedIn Playwright storage state to Fly.io persistent volume (/data/linkedin_session.json)

set -e
cd "$(dirname "$0")/profileAnalyst"

if [ ! -f linkedin_session.json ]; then
  echo "Error: profileAnalyst/linkedin_session.json not found."
  echo "Run: python profileAnalyst/scraper.py --setup   (or --login) locally first."
  exit 1
fi

echo "Uploading linkedin_session.json to Fly.io /data ..."

tar -czf linkedin_session.tar.gz linkedin_session.json

fly ssh console -C "mkdir -p /data"
cat linkedin_session.tar.gz | fly ssh console -C "cat > /tmp/session.tar.gz && cd /data && tar -xzf /tmp/session.tar.gz && rm /tmp/session.tar.gz"

rm linkedin_session.tar.gz

echo "Session uploaded to /data/linkedin_session.json"

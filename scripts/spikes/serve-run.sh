#!/usr/bin/env bash
# Start the built app on :3300 under the memory guard, run a script against it, always stop it.
# Usage: scripts/spikes/serve-run.sh <script.mjs> [args...]
cd "$(dirname "$0")/../.."
NEXT_TELEMETRY_DISABLED=1 ~/bin/memguard 1500 npx next start -p 3300 > /tmp/sc-start.log 2>&1 &
pid=$!
trap 'kill $pid 2>/dev/null; wait $pid 2>/dev/null' EXIT
for i in $(seq 1 40); do curl -s -o /dev/null http://localhost:3300/ && break; sleep 0.5; done
timeout 400 node "$@"

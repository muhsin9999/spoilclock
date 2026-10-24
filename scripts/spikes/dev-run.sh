#!/usr/bin/env bash
# Like serve-run.sh but with `next dev` (readable errors). Memory-guarded, always stopped.
cd "$(dirname "$0")/../.."
node scripts/copy-bryntum.mjs
NEXT_TELEMETRY_DISABLED=1 ~/bin/memguard 3000 npx next dev -p 3300 > /tmp/sc-dev.log 2>&1 &
pid=$!
trap 'kill $pid 2>/dev/null; wait $pid 2>/dev/null' EXIT
for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3300/today && break; sleep 1; done
timeout 400 node "$@"

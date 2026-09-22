#!/bin/bash
# Launched by the "Quick Meal Planner" desktop app to start the dev server
# and open it in the browser once it's ready.
cd "$(dirname "$0")/.."

PORT=3000
URL="http://localhost:$PORT"

if curl -s -o /dev/null "$URL"; then
  echo "Server already running at $URL"
  open "$URL"
  exit 0
fi

npm run dev &
SERVER_PID=$!

echo "Waiting for server at $URL ..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null "$URL"; then
    open "$URL"
    break
  fi
  sleep 1
done

wait $SERVER_PID

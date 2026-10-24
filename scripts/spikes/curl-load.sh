#!/usr/bin/env bash
curl -s -b "sc_run=ba4c35cc-d905-4650-8d6e-5b60e9fdb32d" http://localhost:3300/loads/df72c3d8-ce0c-4978-ac10-6182ee096f86 -o /tmp/load.html -w "%{http_code}\n"
grep -o "Approve and hold payment\|will take all\|Find a buyer\|Round 1" /tmp/load.html | sort | uniq -c

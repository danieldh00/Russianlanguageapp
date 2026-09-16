#!/bin/sh
# Draait de regressiesuites op volgorde en schrijft alles naar één logbestand.
# REGRESS_LOG overrulet de bestandsnaam (default: regress.log).
LOG="${REGRESS_LOG:-regress.log}"
rm -f "$LOG"
for t in test-v16.js test-v18.js test-v19.js test-v20.js test-v21.js test-v22.js test-v23.js test-exam.js test-v24.js; do
  echo "===== $t =====" >> "$LOG"
  node "$t" >> "$LOG" 2>&1
done
echo "DONE" >> "$LOG"

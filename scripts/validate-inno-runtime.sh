#!/usr/bin/env bash
# Runtime validation for Inno Setup SBOM scans (1 GB profile placeholder)
# Usage: scripts/validate-inno-runtime.sh /path/to/installer.exe /tmp/out
set -euo pipefail
installer="$1"
outdir="$2"
mkdir -p "$outdir"
start=$(date +%s)
# TODO: replace with real CLI invocation when fixtures are available.
/usr/bin/time -f "wall_clock_seconds=%e" echo "simulate scan for $installer" >/dev/null
end=$(date +%s)
wall=$((end-start))
printf "RuntimeSeconds=%s\n" "$wall"


#!/usr/bin/env bash
# Sets up this machine to write and run the tests: `make setup`, once.
#
# Installs what is missing and leaves what is there, so running it again is
# safe. It needs only what cloning the repository already needed: git, and on
# a Mac the command line tools that bring git and make.
set -euo pipefail

cd "$(dirname "$0")/.."

# Bold headings on a terminal, plain text in a log or with NO_COLOR, like the Makefile.
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then BOLD=$'\033[1m' PLAIN=$'\033[0m'; else BOLD='' PLAIN=''; fi
step() { printf '\n%s▶ %s%s\n' "$BOLD" "$1" "$PLAIN"; }

# The version package.json pins; the installer takes it as a tag.
BUN_VERSION=$(sed -n 's/.*"packageManager": "bun@\([0-9.]*\)".*/\1/p' package.json)

step "Bun ${BUN_VERSION}"
# A Bun installed by an earlier run is on no PATH until a new shell starts.
export PATH="$HOME/.bun/bin:$PATH"
if command -v bun >/dev/null 2>&1 &&
  bun -e 'process.exit(Bun.semver.satisfies(Bun.version, require("./package.json").engines.bun) ? 0 : 1)'; then
  echo "Bun $(bun --version) is installed."
else
  curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"
  echo "Installed Bun $(bun --version). Open a new terminal for your shell to find it too."
fi

step "Packages, the playwright-cli skill and Chromium"
make install
make browsers

step "ffmpeg, for films as mov or mp4"
# `make test-video` re-encodes with it. Playwright ships an ffmpeg
# that records VP8 but cannot decode it, so this one has to come from the system.
if command -v ffmpeg >/dev/null 2>&1 && ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264; then
  echo "ffmpeg $(ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f3) is installed, with H.264."
elif command -v brew >/dev/null 2>&1; then
  brew install ffmpeg
elif command -v apt-get >/dev/null 2>&1; then
  sudo apt-get install -y ffmpeg
else
  echo "Not installed, and no brew or apt-get to install it with. Films still record as"
  echo "webm (--format=webm); install ffmpeg with libx264 yourself for mov or mp4."
fi

step "Your secrets"
if [ -f .env.staging.local ]; then
  echo ".env.staging.local is there; leaving it as it is."
else
  cp .env.local.example .env.staging.local
  echo "Created .env.staging.local from the example."
fi

step "An AI agent"
found=""
for agent in claude codex cursor-agent cursor kiro; do
  if command -v "$agent" >/dev/null 2>&1; then found="$found $agent"; fi
done
if [ -n "$found" ]; then
  echo "Found:${found}."
else
  echo "None found. /e2e-generate needs one of Claude Code, Codex, Cursor or Kiro."
fi

step "Signing in"
if grep -Eq '^E2E_TEST_USERNAME=.+' .env.staging.local && grep -Eq '^LAB_ID=.+' .env.staging.local; then
  make auth
  printf '\n%sReady.%s Try: make test scenarios/site\n' "$BOLD" "$PLAIN"
else
  echo "Not yet: fill in E2E_TEST_USERNAME, E2E_TEST_PASSWORD and LAB_ID in"
  echo ".env.staging.local (ask the team for them), then run: make auth"
fi

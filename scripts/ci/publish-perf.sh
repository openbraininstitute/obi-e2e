#!/usr/bin/env bash
# Publishes the Lighthouse reports of one deployment to the gh-pages branch, under
# perf/<UTC date>-<environment>/, and prints the page's URL as the step output `url`.
#
#   publish-perf.sh <environment> <pages base url>
#
# Same method as the publish job of e2e.yml: build the branch from a fresh clone,
# push with a lease, and start over from a new clone when another run pushed in
# between. Nothing here touches runs/, runs.json or the dashboard bundle.
set -euo pipefail

environment=$1
base_url=$2
# PERF_PAGES_REMOTE stands in for GitHub when the script is tried out on a local repository.
remote=${PERF_PAGES_REMOTE:-"https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}"}
root=$PWD
folder="$(date -u +%F)-${environment}"

if ! ls perf/report/*.report.html >/dev/null 2>&1; then
  echo "::warning::Lighthouse left no HTML report; nothing to publish."
  exit 0
fi

fold() {
  cd "$root"
  rm -rf _site
  if git clone -q --depth 1 --branch gh-pages "$remote" _site; then
    base=$(git -C _site rev-parse HEAD)
  else
    mkdir -p _site && git -C _site init -q && base=''
  fi

  # A later run of the same day replaces this folder rather than nesting in it.
  rm -rf "_site/perf/$folder"
  mkdir -p "_site/perf/$folder"
  cp perf/report/*.report.html "_site/perf/$folder/"
  touch _site/.nojekyll

  # The page itself: one link per audited page. The reports are a few hundred
  # kilobytes each, so the JSON that sits beside them in the artifact is not kept.
  {
    echo "<!doctype html><meta charset=utf-8><title>Lighthouse ${folder}</title>"
    echo "<h1>Lighthouse · ${environment} · ${folder%-"$environment"}</h1><ul>"
    for report in "_site/perf/$folder"/*.report.html; do
      name=$(basename "$report")
      echo "<li><a href=\"${name}\">${name%.report.html}</a></li>"
    done
    echo "</ul>"
  } >"_site/perf/$folder/index.html"

  # Every deployment keeps its five newest days; older ones go.
  for env_dir in staging production; do
    printf '%s\n' _site/perf/*-"$env_dir" | sort -r | tail -n +6 |
      while read -r old; do rm -rf "$old"; done
  done

  cd _site
  git checkout -q --orphan publish
  git add -A
  git -c user.name=github-actions -c user.email=github-actions@github.com \
    commit -qm "Lighthouse results — $folder"
}

for attempt in 1 2 3 4 5 6 7 8; do
  fold
  if git push -q --force-with-lease="gh-pages:$base" "$remote" HEAD:refs/heads/gh-pages; then
    echo "Published into perf/$folder."
    echo "url=${base_url}/perf/${folder}/" >>"${GITHUB_OUTPUT:-/dev/null}"
    exit 0
  fi
  echo "::notice::gh-pages moved while publishing (attempt $attempt); folding again."
  sleep $((attempt * 5))
done
echo "::error::Could not publish perf/$folder after 8 attempts."
exit 1

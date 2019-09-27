#!/usr/bin/env bash

set -e

scripts/setup-git-ci.sh

GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo ""
echo "------- Checking Schema -------"
echo ""

# Commit the schema if outdated
if ! git diff --exit-code ./build/vega-lite-schema.json
then
  ## Only do this for master
  if [[ $GIT_BRANCH == 'master' ]]; then
    echo "Outdated schema."
    exit 1
  else
    git add ./build/vega-lite-schema.json
    git commit -m "chore: Update schema [CI]"
  fi
fi

echo ""
echo "------- Checking TOC -------"
echo ""

# Commit the TOC if outdated
if ! git diff --exit-code ./site/_includes/docs_toc.md
then
  ## Only do this for master
  if [[ $GIT_BRANCH == 'master' ]]; then
    echo "Outdated TOC."
    exit 1
  else
    git add ./site/_includes/docs_toc.md
    git commit -m "chore: Update TOC [CI]"
  fi
fi

echo ""
echo "------- Checking Examples -------"
echo ""


if git log -1 | grep "\[SVG\]" && [[ $GIT_BRANCH != 'master' ]]; then
  echo "As the latest commit includes [SVG]. Rebuilding all SVGs."
  yarn build:examples-full
else
  yarn build:examples
fi

# Commit examples if outdated

# Note: we need to add all files first so that new files are included in `git diff --cached` too.
# Note: git commands need single quotes for all the files and directories with wildcards
git add ./examples/compiled/vega_version './examples/compiled/*.vg.json' './examples/compiled/*.svg' './examples/specs/normalized/*.vl.json'

if [[ $GIT_BRANCH == 'master' ]]; then
  # Don't diff SVG as floating point calculation is not always consistent
  if ! git diff --cached --word-diff=color --exit-code './examples/compiled/*.vg.json' './examples/specs/normalized/*.vl.json'
  then
    echo "Outdated examples."
    exit 1
  fi
else
  if ! git diff --cached --word-diff=color --exit-code ./examples/compiled/vega_version './examples/compiled/*.vg.json' './examples/compiled/*.svg' './examples/specs/normalized/*.vl.json'
  then
    git commit -m "chore: Update examples [CI]"
  fi
fi


echo ""
echo "------- Checking Code Formatting -------"
echo ""

if [[ $GIT_BRANCH != 'master' ]]; then
  ## For non-master branch, commit eslint fix and prettier changes if outdated
  if ! git diff --word-diff=color --exit-code  src test test-runtime
  then
    git add src test test-runtime
    git commit -m "chore: Auto-formatting [CI]"
  fi

  # Then push all the changes (schema, examples, prettier)
  git push origin ${GITHUB_REF}
fi

exit 0

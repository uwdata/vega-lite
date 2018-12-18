#!/usr/bin/env bash
# script for npm run x-compile

dir=${dir-"examples/compiled"}

echo "Compiling examples to $dir"

# Check if param is provided
if [[ -z "$1" ]];
then
  forcesvg=false
else
  forcesvg=true
fi

# record vega version and force rebuild SVG if version does not match
rm -f $dir/vega-version
echo "vega: `./scripts/version.sh vega`" > $dir/vega_version
if ( ! git diff --no-patch --exit-code HEAD -- $dir/vega_version )
then
  forcesvg=true
fi
export forcesvg

nopatch='--no-patch'
export nopatch

skipnormalize=false
export skipnormalize

# Clean up outdated normalized vega-lite files and vega files
rm -fv examples/specs/normalized/*_normalized.vl.json
rm -fv $dir/*.vg.json

# Re-compile all examples
echo "Using parallel to generate vega specs from examples in parallel."
ls examples/specs/*.vl.json | parallel --env skipnormalize --env forcesvg --env nopatch --eta --no-notice --plus --halt 1 "./scripts/build-example.sh {/..}"

scripts/build-normalized-examples

# Clean up outdated svg files (This has to be done by checking files as we do not always regenerate svgs)
ls examples/compiled/*.svg | parallel --eta --no-notice --plus --halt 1 "[ -f examples/specs/{/..}.vl.json ] || rm -f examples/compiled/{/..}.svg"



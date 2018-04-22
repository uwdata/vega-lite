dir=${dir-"examples/compiled"}


for name in "$@"
do
  echo "Compiling $name" # to $dir (nopatch=$nopatch, forcesvg=$forcesvg)"
  rm -f examples/compiled/$name.vg.json
  bin/vl2vg -p examples/specs/$name.vl.json > examples/compiled/$name.vg.json

  if (! git diff $nopatch --exit-code HEAD -- $dir/$name.vg.json || $forcesvg)
  then
    rm -f examples/compiled/$name.svg
    node_modules/vega/bin/vg2svg --seed 123456789 examples/compiled/$name.vg.json > examples/compiled/$name.svg -b .
  fi
done

#!/bin/sh

# USAGE:
# ./run.sh                                             Standard run
# MAP_ERROR_FREQUENCY=0.5 ./run.sh                     Run that throw a mapError for 50% of chunks

INPUT_URL="http://localhost:3999/sample_text.txt"
if [ -z "$MAP_ERROR_FREQUENCY" ]; then
  MAP_ERROR_INJECTOR=""
else
  MAP_ERROR_INJECTOR="if (Math.random() < $MAP_ERROR_FREQUENCY) { throw new Error('Muahahahahaha...'); }; "
  echo "Throwing a map error with $MAP_ERROR_FREQUENCY probability"
fi

MAP_FUNCTION="function(line) { ${MAP_ERROR_INJECTOR}var words = {}; line.replace(/[^\s\w]/g, '').split(/\s/).forEach(function(w) { w = w.toLowerCase(); words[w] = (words[w] || 0) + 1; }); return words; }"
REDUCE_FUNCTION="function(k, values){ return values.length; }"

curl --data-urlencode "inputUrl=$INPUT_URL" --data-urlEncode "mapFunction=$MAP_FUNCTION" --data-urlEncode "reduceFunction=$REDUCE_FUNCTION" http://127.0.0.1:3010/job/new
echo ""

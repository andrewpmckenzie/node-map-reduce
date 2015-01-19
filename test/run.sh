#!/bin/sh

INPUT_URL="http://localhost:3999/sample_text.txt"
MAP_FUNCTION="function(line) { var words = {}; line.replace(/[^\s\w]/g, '').split(/\s/).forEach(function(w) { w = w.toLowerCase(); words[w] = (words[w] || 0) + 1; }); return words; }"
REDUCE_FUNCTION="function(k, values){ return values.length; }"

curl --data-urlencode "inputUrl=$INPUT_URL" --data-urlEncode "mapFunction=$MAP_FUNCTION" --data-urlEncode "reduceFunction=$REDUCE_FUNCTION" http://127.0.0.1:3010/job/new
echo ""

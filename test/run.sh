#!/bin/sh

curl --data "inputUrl=http%3A%2F%2Flocalhost:3999%2Fsample_text.txt&reduceFunction=function(k%2C+values)%7B+return+values.length%3B+%7D&mapFunction=(function(line)+%7B+var+words+%3D+%7B%7D%3B+line.split('+').forEach(function(w)+%7B+w+%3D+w.toLowerCase()%3B+words%5Bw%5D+%3D+(words%5Bw%5D+%7C%7C+0)+%2B+1%3B++%7D)%3B+return+words%3B+%7D)" http://127.0.0.1:3010/job/new
echo ""

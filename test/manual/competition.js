var http = require('http');
var url = 'http://localhost:3999/sample_text.txt';

var wordCounts = {};
var start = +new Date();

http.get(url, function(response) {
  response.on('data', function(data) {
    ('' + data).replace(/[^\s\w]/g, '').split(/\s/).forEach(function(word) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });

  response.on('end', function() {
    Object.keys(wordCounts).forEach(function(k) {
      console.log(k + '    ' + wordCounts[k]);
    });

    var time = (+new Date() - start) / 1000;
    console.log('');
    console.log('Completed in ' + time + 's.');
  });
});

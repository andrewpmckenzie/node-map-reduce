Template.registerHelper('asJson', function(obj, trimQuotes) {
  var result = obj ? JSON.stringify(obj, null, '\t') : '';
  return trimQuotes ? result.replace(/^"(.+)"$/g, '$1') : result;
});

Template.registerHelper('asArray', function(obj) {
  return Object.keys(obj || {}).map(function(k) { return { k: k, v: obj[k] }; });
});

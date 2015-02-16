Template.registerHelper('asJson', function(obj) {
  return obj ? JSON.stringify(obj, null, '\t') : '';
});

Template.registerHelper('asArray', function(obj) {
  return Object.keys(obj || {}).map(function(k) { return { k: k, v: obj[k] }; });
});

var NUMBER_OF_TEST_CHUNKS_TO_FETCH = 5;

Template.createJobForm.helpers({
  testResults: function() {
    var template = Template.instance();
    var inputChunks = template.testInput.get();

    if (inputChunks.length === 0) {
      return undefined;
    }

    var mapFunction, reduceFunction, mapEvalError, reduceEvalError, mapResults, reduceResults, hasMapError, hasReduceError;

    try {
      mapFunction = eval('(' + template.mapFunction + ')');
    } catch (e) {
      mapEvalError = e.message;
      hasMapError = true;
    }

    try {
      reduceFunction = eval('(' + template.reduceFunction + ')');
    } catch(e) {
      reduceEvalError = e.message;
      hasReduceError = true;
    }

    if (!(mapEvalError || reduceEvalError)) {
      mapResults = inputChunks.map(function (input) {
        var result, error;
        try { result = mapFunction(input) } catch (e) { error = e.message; }
        hasMapError = hasMapError || !!error;
        return {
          input: input,
          result: result,
          error: error
        }
      });

      var mergedResults = {};
      _.each(mapResults, function (mapResult) {
        _.each(mapResult.result, function (value, key) {
          mergedResults[key] = mergedResults[key] || [];
          mergedResults[key].push(value);
        });
      });

      reduceResults = _.map(mergedResults, function (values, key) {
        var result, error;
        try { result = reduceFunction(null, values) } catch (e) { error = e.message; }
        hasReduceError = hasReduceError || !!error;
        return {
          key: key,
          values: values,
          result: result,
          error: error
        }
      });
    }

    return {
      mapResults: mapResults,
      reduceResults: reduceResults,
      mapEvalError: mapEvalError,
      reduceEvalError: reduceEvalError,
      hasMapError: hasMapError,
      hasReduceError: hasReduceError
    };
  }
});

Template.createJobForm.events({
  'click .cancel': function() { Session.set('actionSectionTemplate', 'actionSectionButtons'); return false; },

  'submit form': function(event, template) {
    var fields = ['mapFunction', 'reduceFunction', 'inputUrl'];
    var data = {};
    fields.forEach(function(fieldName) {
      data[fieldName] = template.find('[name="' + fieldName + '"]').value;
    });

    var isTest = $(document.activeElement).hasClass('test');
    if (isTest) {
      Meteor.call('getTestInput', data.inputUrl, NUMBER_OF_TEST_CHUNKS_TO_FETCH, function(error, result) {
        template.mapFunction = data.mapFunction;
        template.reduceFunction = data.reduceFunction;
        error ? alert(error) : template.testInput.set(result);
      });
    } else {
      Meteor.call('createJob', data.inputUrl, data.mapFunction, data.reduceFunction, function(error, result) {
        Session.set('actionSectionTemplate', 'actionSectionButtons');
      });
    }

    return false;
  }
});

Template.createJobForm.created = function() {
  this.testInput = new ReactiveVar([]);
  this.mapFunction = function(line) {};
  this.reduceFunction = function(key, value) {};
};

Template.createJobForm.rendered = function() {
  this.findAll('.editor').forEach(function(el) {
    // http://codemirror.net
    CodeMirror.fromTextArea(el, {
      lineNumbers: true,
      mode: 'javascript'
    });
  });
};

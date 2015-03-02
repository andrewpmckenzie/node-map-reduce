Router.route('/', function () { this.render('index'); });

Router.route('/job/:id', function () {
  var job = JobsHelper.getOne(1 * this.params.id);
  this.render('job', {data: job});
});

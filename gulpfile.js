'use strict';

var gulp = require('gulp'), pump = require('pump');
var $ = require('gulp-load-plugins')({DEBUG: true});

var distDir = './dist', srcDir = './src', paths = {
  html: {src: [srcDir + '/**/*.html']},
  js: {src: [srcDir + '/**/*.js']},
  sass: {src: [srcDir + '/**/*.scss']}
};

var sassTask = function (usemin) {
  var tasks = [gulp.src(paths.sass.src), $.sass({outputStyle: 'compressed'}),
    $.sourcemaps.init(), $.autoprefixer({browsers: ['last 2 versions', 'ie 6-8']}),
    $.rename({suffix: '.min'}), $.rev(), $.sourcemaps.write('./')];
  return usemin ? tasks : tasks.concat([gulp.dest(distDir), $.connect.reload()]);
};

var jsTask = function (usemin, path) {
  var tasks = [gulp.src(path || paths.js.src), /*$.sourcemaps.init(), $.uglify({ie8: true}),*/
    $.rename({suffix: '.min'}), $.rev()/*, $.sourcemaps.write('./')*/];
  return usemin ? tasks : tasks.concat([gulp.dest(distDir), $.connect.reload()]);
};

gulp.task('clean', function (cb) {
  pump([gulp.src(distDir, {read: false}), $.clean()], cb);
});

gulp.task('html', function (cb) {
  pump([gulp.src(paths.html.src),
    $.usemin({
      scss: sassTask(true), vendorCss: sassTask(true),
      html: [$.htmlmin({collapseWhitespace: false})],
      js: jsTask(true), vendorJs: jsTask(true), demoJs: jsTask(true)
    }), gulp.dest(distDir), $.connect.reload()], cb);
});

gulp.task('sass', function (cb) {
  pump(sassTask(), cb);
});

gulp.task('js', function (cb) {
  pump(jsTask(), cb);
});

gulp.task('fonts', function () {
  gulp.src('bower_components/bootstrap/fonts/*').pipe(gulp.dest(distDir + '/fonts'));
  gulp.src('resources/iconfont/*.{eot,svg,ttf,woff}').pipe(gulp.dest(distDir + '/css'));
});

gulp.task('watch', ['build'], function () {
  gulp.watch(paths.html.src, ['html']);
  gulp.watch(paths.sass.src, ['sass', 'html']);
  gulp.watch([paths.js.src, 'gulpfile.js'], ['js', 'html']);
});

gulp.task('server', ['watch'], function () {
  var server = $.connect.server({root: distDir, livereload: true});
  return gulp.src('.').pipe($.open({uri: 'http://' + server.host + ':' + server.port}));
});

gulp.task('build', ['clean'], function () {
  gulp.start(['sass', 'fonts', 'js', 'html']);
});

gulp.task('dist', ['clean'], function (cb) {
  gulp.start(['sass']);
  pump(jsTask(false, srcDir + '/**/bootstrap-cascader.js'), cb);
  gulp.src('resources/iconfont/*.{eot,svg,ttf,woff}').pipe(gulp.dest(distDir + '/css'));
});

gulp.task('default', ['dist']);
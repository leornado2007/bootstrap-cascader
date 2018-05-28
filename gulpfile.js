'use strict';

var gulp = require('gulp'), pump = require('pump');

var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var clean = require('gulp-clean');
var connect = require('gulp-connect');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var rename = require('gulp-rename');
var usemin = require('gulp-usemin');
var autoprefixer = require('gulp-autoprefixer');
var open = require('gulp-open');
var concat = require('gulp-concat');
var replace = require('gulp-replace');

var name = 'bootstrap-cascader', siteDir = './site', distDir = './dist', srcDir = './src', paths = {
  html: {src: [srcDir + '/**/*.html']},
  js: {src: [srcDir + '/**/*.js']},
  sass: {src: [srcDir + '/**/*.scss']}
};

var sassTask = function (usemin) {
  var tasks = [gulp.src(paths.sass.src), sass({outputStyle: 'compressed'}),
    sourcemaps.init(), autoprefixer({browsers: ['last 2 versions', 'ie 6-8']}),
    replace(/iconfont\.([a-z]{3})/g, name + '.$1'),
    replace(/font-family:\s*\"iconfont\"/g, 'font-family: "' + name + '"'),
    rename({suffix: '.min'}), sourcemaps.write('./')];
  return usemin ? tasks : tasks.concat([gulp.dest(siteDir), connect.reload()]);
};

var jsTask = function (usemin, path) {
  var tasks = [gulp.src(path || paths.js.src), sourcemaps.init(), uglify({ie8: true}),
    rename({suffix: '.min'}), sourcemaps.write('./')];
  return usemin ? tasks : tasks.concat([gulp.dest(siteDir), connect.reload()]);
};

gulp.task('clean-site', function (cb) {
  pump([gulp.src(siteDir, {read: false}), clean()], cb);
});

gulp.task('clean-dist', function (cb) {
  pump([gulp.src(distDir, {read: false}), clean()], cb);
});

gulp.task('html', function (cb) {
  pump([gulp.src(paths.html.src),
    usemin({
      scss: sassTask(true), vendorCss: sassTask(true),
      html: [htmlmin({collapseWhitespace: false})],
      js: jsTask(true), vendorJs: jsTask(true), demoJs: jsTask(true)
    }), gulp.dest(siteDir), connect.reload()], cb);
});

gulp.task('sass', function (cb) {
  pump(sassTask(), cb);
});

gulp.task('js', function (cb) {
  pump(jsTask(), cb);
});

gulp.task('fonts', function () {
  gulp.src('bower_components/bootstrap/fonts/*').pipe(gulp.dest(siteDir + '/fonts'));
  gulp.src('resources/iconfont/*.{eot,svg,ttf,woff}')
      .pipe(rename(function (path) {
        path.basename = name;
      }))
      .pipe(gulp.dest(siteDir + '/css'));
});

gulp.task('watch', ['site'], function () {
  gulp.watch(paths.html.src, ['html']);
  gulp.watch(paths.sass.src, ['sass', 'html']);
  gulp.watch([paths.js.src, 'gulpfile.js'], ['js', 'html']);
});

gulp.task('server', ['watch'], function () {
  var server = connect.server({root: siteDir, livereload: true});
  return gulp.src('.').pipe(open({uri: 'http://' + server.host + ':' + server.port}));
});

gulp.task('site', ['clean-site'], function () {
  gulp.start(['sass', 'fonts', 'js', 'html']);
});

gulp.task('dist', ['clean-dist'], function (cb) {

  gulp.src(paths.sass.src.concat(['resources/**/iconfont.css']))
      .pipe(sass({outputStyle: 'compressed'}))
      .pipe(sourcemaps.init())
      .pipe(concat(name + '.css'))
      .pipe(autoprefixer({browsers: ['last 2 versions', 'ie 6-8']}))
      .pipe(replace(/iconfont\.([a-z]{3})/g, name + '.$1'))
      .pipe(replace(/font-family:\s*\"iconfont\"/g, 'font-family: "' + name + '"'))
      .pipe(rename({suffix: '.min'}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(distDir + '/css'));

  gulp.src('src/**/' + name + '.js')
      .pipe(sourcemaps.init())
      .pipe(uglify({ie8: true}))
      .pipe(rename({suffix: '.min'}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(distDir));

  gulp.src('resources/iconfont/*.{eot,svg,ttf,woff}')
      .pipe(rename(function (path) {
        path.basename = name;
      }))
      .pipe(gulp.dest(distDir + '/css'));

});

gulp.task('default', ['dist']);
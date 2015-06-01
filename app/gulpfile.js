"use strict";

var gulp = require('gulp');
var browserify = require('browserify');
var tsify = require('tsify');
var ts = require('gulp-typescript');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var less = require('gulp-less');
var nop = require('gulp-nop');
var watchify = require('watchify');
var gutil = require('gulp-util');

var isProd = process.env.NODE_ENV === 'production';

var watching = false;

gulp.task('enable-watch-mode', function() {
    watching = true;
});

gulp.task('browserify', function() {
    var bundler = browserify({ debug: !isProd, packageCache: {} })
        .add('./src/index.ts')
        .plugin(tsify, { noImplicitAny: true, target: 'ES5' });

    if (watching) {
        bundler = watchify(bundler);
        bundler.on('update', function(ids) {
            gutil.log('Updating browserify bundle: ' + ids);

            var stream = bundler.bundle()
                .on('error', function(err) {
                    gutil.log(err.message);
                })
                .pipe(source('app.js'))
                .pipe(gulp.dest('../public'));
        });

        bundler.on('bytes', function(bytes) {
            gutil.log('Updated browserify bundle: ' + bytes + " bytes written.");
        });
    }

    return bundler.bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('../public'));
});

gulp.task('less', function() {
    return gulp.src('./less/main.less')
      .pipe(isProd ? nop() : sourcemaps.init())
      .pipe(less())
      .pipe(isProd ? nop() : sourcemaps.write('./'))
      .pipe(gulp.dest('../public'));
});

gulp.task('copy-jquery', function() {
    return gulp.src('./node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('../public'));
});

gulp.task('copy-bootstrap', function() {
    return gulp.src([
        './node_modules/bootstrap/dist/js/bootstrap.min.js',
        './node_modules/pikaday/css/pikaday.css'
    ]).pipe(gulp.dest('../public'));
});

gulp.task('copy-fonts', function() {
    return gulp.src('./node_modules/bootstrap/dist/fonts/*', { base: './node_modules/bootstrap/dist/' })
        .pipe(gulp.dest('../public'));
});

gulp.task('copy-html', function() {
    return gulp.src(['./index.html', 'favicon.ico'])
        .pipe(gulp.dest('../public'));
});

gulp.task('build', ['browserify', 'less', 'copy-jquery', 'copy-fonts', 'copy-bootstrap', 'copy-html']);

gulp.task('watch', ['enable-watch-mode', 'browserify']);
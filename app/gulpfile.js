"use strict";

var gulp = require('gulp');
var browserify = require('browserify');
var tsify = require('tsify');
var ts = require('gulp-typescript');
var merge = require('merge2');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var less = require('gulp-less');

gulp.task('browserify', function() {
    var bundler = browserify({ debug: true })
        .add('./src/index.ts')
        .plugin(tsify, { noImplicitAny: true, target: 'ES6' });

    return bundler.bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('../public'));
});

gulp.task('less', function() {
    return gulp.src('./less/main.less')
      .pipe(sourcemaps.init())
      .pipe(less())
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('../public'));
});

gulp.task('copy-jquery', function() {
    return gulp.src('./node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('../public'));
});

gulp.task('copy-bootstrap', function() {
    return gulp.src('./node_modules/bootstrap/dist/js/bootstrap.min.js')
        .pipe(gulp.dest('../public'));
});

gulp.task('copy-html', function() {
    return gulp.src('./index.html')
        .pipe(gulp.dest('../public'));
});

gulp.task('build', ['browserify', 'copy-jquery', 'copy-bootstrap', 'copy-html']);
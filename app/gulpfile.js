"use strict";

var gulp = require('gulp');
var browserify = require('browserify');
var tsify = require('tsify');
var ts = require('gulp-typescript');
var merge = require('merge2');
var source = require('vinyl-source-stream');

gulp.task('browserify', function() {
    var bundler = browserify()
        .add('./index.ts')
        .plugin(tsify, { noImplicitAny: true, target: 'es5' });

    return bundler.bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('../public'));
});
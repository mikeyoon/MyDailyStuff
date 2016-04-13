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

var isProd = process.env.NODE_ENV === 'production';

var watching = false;

gulp.task('enable-watch-mode', function() {
    watching = true;
});

gulp.task('browserify', function() {
    var bundler = browserify({ debug: !isProd, packageCache: {} })
        .add('./src/index.ts')
        .plugin(tsify, { noImplicitAny: true, target: 'ES5', jsx: "react", allowSyntheticDefaultImports: true });

    if (watching) {
        bundler = watchify(bundler);
        bundler.on('update', function(ids) {
            console.log('Updating browserify bundle: ' + ids);

            var stream = bundler.bundle()
                .on('error', function(err) {
                    console.log(err.message);
                })
                .pipe(source('app.js'))
                .pipe(gulp.dest('../public/js'));
        });

        bundler.on('bytes', function(bytes) {
            console.log('Updated browserify bundle: ' + bytes + " bytes written.");
        });
    }

    return bundler.bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('../public/js'));
});

gulp.task('less', function() {
    return gulp.src('./less/main.less')
      .pipe(isProd ? nop() : sourcemaps.init())
      .pipe(less())
      .pipe(isProd ? nop() : sourcemaps.write('./'))
      .pipe(gulp.dest('../public/css'));
});

gulp.task('less-landing', function() {
    return gulp.src('./less/landing.less')
        .pipe(isProd ? nop() : sourcemaps.init())
        .pipe(less())
        .pipe(isProd ? nop() : sourcemaps.write('./'))
        .pipe(gulp.dest('../public/css'));
});

gulp.task('copy-vendor', function() {
    return gulp.src([
        './node_modules/bootstrap/dist/js/bootstrap.min.js',
        './node_modules/jquery/dist/jquery.min.js',
        './vendor/ie10-viewport-bug-workaround.js',
        './vendor/jquery.unveilEffects.js',
        './vendor/retina-1.1.0.js'
    ])
    .pipe(gulp.dest('../public/js'));
});

gulp.task('copy-images', function() {
    return gulp.src([
        './images/*'
    ])
    .pipe(gulp.dest('../public/img'));
});

gulp.task('copy-fonts', function() {
    return gulp.src('./node_modules/bootstrap/dist/fonts/*', { base: './node_modules/bootstrap/dist/' })
        .pipe(gulp.dest('../public'));
});

gulp.task('copy-html', function() {
    return gulp.src(['index.html', 'favicon.ico', 'app.html'])
        .pipe(gulp.dest('../public'));
});

gulp.task('build', ['browserify', 'less', 'less-landing', 'copy-vendor', 'copy-fonts', 'copy-images', 'copy-html']);

gulp.task('watch', ['enable-watch-mode', 'browserify']);
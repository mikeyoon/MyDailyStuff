"use strict";

var path = require('path');
var gulp = require('gulp');
var shell = require('gulp-shell');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var less = require('gulp-less');
var nop = require('gulp-nop');
var watch = require('gulp-watch');
var tsc = require('typescript');
var Builder = require('systemjs-builder');
var shell = require('gulp-shell');
var minify = require('gulp-minify');
var CacheBuster = require('gulp-cachebust');

var checksum = new CacheBuster();

var isProd = process.env.NODE_ENV === 'production';

var watching = false;
var builder = new Builder('./', './config.js');

var vendorAssets = [
    'bootstrap',
    'fluxxor',
    'react',
    'classnames',
    'jquery',
    'lodash',
    'marked',
    'moment',
    'page',
    'react',
    'react-date-picker',
    'react-dom',
    'rest',
    'rest/interceptor/mime',
    'rest/interceptor/csrf',
    'rest/interceptor/errorCode',
];

gulp.task('enable-watch-mode', function() {
    watching = true;
});

gulp.task('less', function() {
    return gulp.src('./less/main.less')
        .pipe(isProd ? nop() : sourcemaps.init())
        .pipe(less())
        .pipe(isProd ? checksum.resources() : nop())
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
        './vendor/retina-1.1.0.js',
        'config.js',
        'jspm_packages/system-csp-production.js',
        'jspm_packages/system-polyfills.js'
    ])
    .pipe(isProd ? checksum.resources() : nop())
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

gulp.task('copy-favicon', function() {
    return gulp.src('favicon.ico')
        .pipe(gulp.dest('../public'));
});

gulp.task('tsc', function() {
    return watching ? null : gulp.src('./src/index.ts')
        .pipe(ts({
            typescript: tsc,
            outFile: 'app.js',
            allowSyntheticDefaultImports: true,
            jsx: 'react',
            target: 'ES5',
            module: 'system'
        }))
        .pipe(minify({
            noSource: true,
            ext: {
                min: '.js'
            }
        }))
        .pipe(isProd ? checksum.resources({ root: '/js' }) : nop())
        .pipe(gulp.dest('../public/js'))
});

gulp.task('vendor', function() {
    return builder.bundle(vendorAssets.join(' + '), '../public/js/vendor.js', {
        sourceMaps: isProd ? false : 'inline',
        minify: isProd,
        mangle: isProd
    });
});

gulp.task('build-assets', ['less', 'less-landing', 'copy-vendor', 'copy-fonts', 'copy-images', 'tsc', 'vendor'], function() {
    return gulp.src(['../public/js/vendor.js'])
        .pipe(isProd ? checksum.resources() : nop())
        .pipe(gulp.dest('../public/js'));
});
gulp.task('build', ['build-assets', 'copy-html']);

gulp.task('tsc-watch', ['build'], shell.task([
    path.join('node_modules', '.bin', 'tsc'),
    '--pretty',
    '--allowSyntheticDefaultImports',
    '--module system',
    '--target ES5',
    '--jsx react',
    '--outFile ../public/js/app.js',
    '--inlineSourceMap --inlineSources',
    '-w',
    'src/index.ts'
].join(' ')));

gulp.task('less-watch', function() {
    return gulp.watch(['less/**/*.less'], ['less']);
});

gulp.task('watch', ['enable-watch-mode', 'tsc-watch', 'less-watch']);

gulp.task('deploy', ['build-assets', 'copy-favicon'], function() {
    return gulp.src(['index.html', 'app.html'])
        .pipe(isProd ? checksum.references() : nop())
        .pipe(gulp.dest('../public'));
});
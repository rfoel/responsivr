'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var pkg = require('./package.json');
var minifyCSS = require('gulp-minify-css');
var comment = '\/*\r\n* Responsivr ' + pkg.version + '\r\n* Copyright 2017, Rafael Franco\r\n* https:\/\/rfoel.github.io\/responsivr\/\r\n* Free to use under the MIT license.\r\n *\/\r\n';
var $ = require('gulp-load-plugins')();

gulp.task('build', function () {
  return gulp.src('./src/responsivr.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe($.concat('responsivr.css'))
    .pipe($.header(comment + '\n'))
    .pipe($.size())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('minify', ['build'], function() {
  return gulp.src(['./dist/responsivr.css'])
    .pipe(minifyCSS())
    .pipe($.header(comment))
    .pipe($.size())
    .pipe($.size({
      gzip: true
    }))
    .pipe($.concat('responsivr.min.css'))
    .pipe(gulp.dest('./dist/'));
});


gulp.task('watch', function() {
  gulp.watch(['src/*.scss'], ['default']);
});


gulp.task('default', ['build', 'minify']);

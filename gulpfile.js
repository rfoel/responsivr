"use strict"

const gulp = require("gulp")
const sass = require("gulp-sass")
const pkg = require("./package.json")
const minifyCSS = require("gulp-minify-css")
const comment =
  "/*\r\n* Responsivr " +
  pkg.version +
  "\r\n* Copyright 2017, Rafael Franco\r\n* https://rfoel.github.io/responsivr/\r\n* Free to use under the MIT license.\r\n */\r\n"
const $ = require("gulp-load-plugins")()
const browserSync = require("browser-sync").create()

gulp.task("sass", () => {
  return gulp
    .src("./src/responsivr.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe($.concat("responsivr.css"))
    .pipe($.header(comment + "\n"))
    .pipe($.size())
    .pipe(gulp.dest("./dist/"))
})

gulp.task("minify", ["build"], () => {
  return gulp
    .src(["./dist/responsivr.css"])
    .pipe(minifyCSS())
    .pipe($.header(comment))
    .pipe($.size())
    .pipe(
      $.size({
        gzip: true
      })
    )
    .pipe($.concat("responsivr.min.css"))
    .pipe(gulp.dest("./dist/"))
})

gulp.task("watch", () => {
  gulp.watch(["src/*.scss"], ["sass"])
})

gulp.task("server", () => {
  browserSync.init({
    files: ["./dist/**", "./*.html"],
    port: "8888",
    server: {
      baseDir: ["dist", "."]
    }
  })
})

gulp.task("build", ["sass", "minify"])
gulp.task("default", ["sass", "watch", "server"])
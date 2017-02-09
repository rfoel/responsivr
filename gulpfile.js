var gulp = require('gulp');
var pug = require('gulp-pug');
var sass = require('gulp-ruby-sass');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var imagemin = require('gulp-imagemin');

gulp.task('default', ['sass', 'js', 'images']);

gulp.task('watch', function() {
	gulp.watch('./dev/sass/**/*', ['sass']);
	gulp.watch('./dev/js/**/*', ['js']);
	gulp.watch('./dev/views/**/*', ['views']);
});

gulp.task('fonts', function() {
	return gulp.src(['./dev/fonts/**'])
	.pipe(gulp.dest('./dist/fonts/'));
});

gulp.task('sass', function() {
	sass('./dev/sass/responsivr.scss')
	.on('error', sass.logError)
	// .pipe(uglifycss())
	// .pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest('./dist/css/'));
});

gulp.task('views', function buildHTML() {
	return gulp.src('./dev/views/*.pug')
	.pipe(pug({
		pretty: true
	}))
	.pipe(gulp.dest('./'));
});

gulp.task('jslib', function() {
	return gulp.src(['./node_modules/jquery/dist/jquery.js', './dev/js/prism.js'])
	.pipe(concat('lib.js'))
	// .pipe(uglify())
	// .pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest('./dist/js/'));
});

gulp.task('css', function() {
	return gulp.src(['./dev/css/*'])
	.pipe(concat('page.css'))
	// .pipe(uglify())
	// .pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest('./dist/css/'));
});

gulp.task('js', function() {
	return gulp.src([
		'./dev/js/scrollspy.js', 
		'./dev/js/waves.js',
		'./dev/js/selecty.js',
		'./dev/js/responsivr.js'
		])
	.pipe(concat('responsivr.js'))
	// .pipe(uglify())
	// .pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest('./dist/js/'));
});

gulp.task('images', function() {
	gulp.src('./dev/images/*')
	.pipe(imagemin())
	.pipe(gulp.dest('./dist/images/'));
});
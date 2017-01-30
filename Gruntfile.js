module.exports = function(grunt) {
	grunt.initConfig({
		pug: {
			compile: {
				options: {
					pretty: true
				},
				files: {
					'index.html': 'pug/index.pug',
					'components.html': 'pug/components.pug',
				}
			}
		},

		sass: {
			expanded: {
				options: {
					outputStyle: 'expanded',
					sourcemap: false,
				},
				files: {
					'css/responsivr.css': 'sass/responsivr.scss',
				}
			},

			min: {
				options: {
					outputStyle: 'compressed',
					sourcemap: false
				},
				files: {
					'css/responsivr.min.css': 'sass/responsivr.scss',
				}
			},
		},

		watch: {
			pug: {
				files: ['pug/**/*'],
				tasks: ['pug_compile'],
				options: {
					interrupt: false,
					spawn: false,
				},
			},
			sass: {
				files: ['sass/**/*'],
				tasks: ['sass_compile'],
				options: {
					interrupt: false,
					spawn: false,
				},
			}
		},

		concurrent: {
			options: {
				logConcurrentOutput: true,
				limit: 10,
			},
			monitor: {
				tasks: ["watch:pug", "watch:sass", "notify:watching"]
			}
		},

		notify: {
			watching: {
				options: {
					enabled: true,
					message: 'Watching Files!',
					title: "Responsivr",
					success: true,
					duration: 1
				}
			},

			sass_compile: {
				options: {
					enabled: true,
					message: 'Sass Compiled!',
					title: "Responsivr",
					success: true,
					duration: 1
				}
			},

			pug_compile: {
				options: {
					enabled: true,
					message: 'Pug Compiled!',
					title: "Responsivr",
					success: true,
					duration: 1
				}
			},
		},
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-sass');
	grunt.loadNpmTasks('grunt-contrib-pug');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-notify');

	grunt.registerTask('release',['pug', 'sass:expanded','sass:min']);

	grunt.registerTask('sass_compile', ['notify:sass_compile']);
	grunt.registerTask('pug_compile', ['notify:pug_compile']);
	grunt.registerTask('monitor', ["concurrent:monitor"]);
	grunt.registerTask('default', ['release','watch']);
};
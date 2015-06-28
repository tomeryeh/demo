module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-watch');

	return {
		js: {
			files: ['src/**/*.js',
				"../server/*.js",
				"../tests/{ui,services}/*.js"
			],
			tasks: ['newjshint'],
			options: {
				debounceDelay: 250,
				spawn: true,
				interrupt: true
			}
		},
		html: {
			files: ['index.html'],
			//tasks: ['handlebars'],
			options: {
				debounceDelay: 250,
				spawn: true
			}
		},
		configFiles: {
			files: ['Gruntfile.js', 'grunt/*.js'],
			options: {
				reload: true,
				debounceDelay: 250,
				spawn: true,
				interrupt: true
			}
		},
		less: {
			files: 'css/*.less',
			tasks: ['less'],
			options: {
				debounceDelay: 250,
				spawn: true,
				interrupt: true
			}
		},
		json: {
			files: ['locales/**/*.json'],
			tasks: ['jsonlint'],
			options: {
				debounceDelay: 250,
				spawn: true,
				interrupt: true
			}
		},
		livereload: {
			options: {
				livereload: true
			},
			files: [
				'css/app.css',
				'src/**/*.js',
				'index.html',
				'locales/**/*.json'
			]
		}
	};
};

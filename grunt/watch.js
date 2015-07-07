module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-watch');

	return {
		html: {
			files: ['client/index.html'],
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
			files: 'client/css/*.less',
			tasks: ['less'],
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
				'client/css/app.css',
				'client/src/**/*.js',
				'client/index.html',
				'locales/**/*.json'
			]
		}
	};
};

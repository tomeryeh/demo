module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-newer');

	return {
		options: {

			reporter: require('jshint-stylish'),
			/*
			           curly : true,
			           eqeqeq : true,
			           eqnull : true,
			           */
			browser: true,
			globals: {
				jQuery: true
			}
		},
		all: {
			src: [
				'{marionette,angular}/src/**/*.js',
				"Gruntfile.js",
				'../server/server.js',
				"!angular/src/node_modules/**",
				"!marionette/src/prec/*"
			]
		}
	};
};

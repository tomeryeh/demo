module.exports = function(grunt) {
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
		all: ['{marionette,angular,react}/src/**/*.js', "Gruntfile.js",
			"!marionette/src/vendors/require/require.js",
			"!marionette/src/prec/*"
		]
	};
};

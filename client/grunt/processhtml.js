module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-processhtml');
	return {
		build: {
			options: {
				process: true,
			},
			files: {
				'marionette/build/index.html': ['marionette/build/index.html']
			}
		}
	};
};

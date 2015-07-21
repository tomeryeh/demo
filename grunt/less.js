module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-less');

	return {
		build: {

			options: {
				paths: [ // Where to look for files to @import
					"css/"
				],
				compress: true
			},
			files: [{
				"css/app.css": "css/app.less"
			}]
		}
	};
};

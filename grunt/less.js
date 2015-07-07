module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-less');

	return {
		build: {

			options: {
				paths: [ // Where to look for files to @import
					"client/css/"
				],
				compress: true
			},
			files: [{
				"client/css/app.css": "client/css/app.less"
			}]
		}
	};
};

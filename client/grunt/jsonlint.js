module.exports = function(grunt) {

	grunt.loadNpmTasks("grunt-jsonlint");
	return {
		sample: {
			src: ['locales/**/*.json',
				"{angular,marionette,react}/package.json",
				"{angular,marionette,react}/bower.json",
				"package.json",
				"../package.json"
			]
		}
	};
};

module.exports = function(grunt) {

	grunt.loadNpmTasks("grunt-jscs");

	return {
		options: {
			"disallowEmptyBlocks": true,
			"disallowImplicitTypeConversion": ["numeric", "boolean", "binary", "string"],
			"disallowKeywords": ["with", "eval"],
			"disallowMixedSpacesAndTabs": true,
			"disallowMultipleLineBreaks": true,
			"disallowMultipleLineStrings": true,
			"disallowMultipleVarDecl": true,
			"requireCommaBeforeLineBreak": true
		},
		all: [
			'{marionette,react,angular}/src/**.js',
			"!marionette/src/vendors/require/require.js",
			"!react/src/**",
			"!marionette/src/prec/*"
		]
	};
};

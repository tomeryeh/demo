module.exports = function(grunt) {

	grunt.loadNpmTasks("grunt-jsbeautifier");

	return {
		files: [
			"client/src/**/*.{js,html,json}",
			"client/*.{js,html}",
			"Gruntfile.js",
			"grunt/*.js",
			"server/*.js"
			//,'!app/lib/**'
		],
		options: {
			js: {
				indentChar: "	",
				indentSize: 1,
				maxPreserveNewlines: 2
			},
			json: {
				indentChar: "	",
				indentSize: 1,
				maxPreserveNewlines: 2
			},
			//              css: {
			//                  fileTypes: [".less"],
			//                  indentChar: "   ",
			//                  preserve_newlines: true,
			//                  //breakChainedMethods: false,
			//                  indentSize: 1,
			//                  maxPreserveNewlines: 2
			//              },
			html: {
				indentChar: "	",
				indentScripts: "keep",
				//preserve_newlines: false,
				indentSize: 1,
				maxPreserveNewlines: 2
			}
		}
	};
};

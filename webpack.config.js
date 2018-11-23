module.exports = {
	context : __dirname,
	entry	: {
		'main' : __dirname + '/src/js/main.js'
	},
	output: {
		filename: "[name].min.js",
		path : __dirname + '/src/js/dist',
	},
	module :{
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader'
				}
			}
        ]
	},
	devtool : 'sourcemap',
};
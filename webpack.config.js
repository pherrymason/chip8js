module.exports = {
	context : __dirname,
	entry	: {
		'main' : './src/js/main.js'
	},
	output: {
		filename: "[name].min.js",
		path : './src/js',
//		publicPath : publicPath + '/js/min/',
		pathInfo : true
	},
	module :{
		loaders: [
            { test: /\.jsx$/, loader: 'jsx-loader'}
        ]
	},
	devtool : 'sourcemap',
	debug   : true
};
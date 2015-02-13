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
	resolve : {
        //packageAlias: false,
        alias : {
            jquery       : __dirname + '/bower_components/jquery/dist/jquery.js',
            backbone     : __dirname + '/bower_components/backbone/backbone.js',
            underscore   : __dirname + '/bower_components/underscore/underscore.js',
            react       : __dirname + '/node_modules/react/react.js'
		}
	},
	module :{
		loaders: [
            { test: /\.jsx$/, loader: 'jsx-loader'}
        ]
	},
	devtool : 'sourcemap',
	debug   : true
};
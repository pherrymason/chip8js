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
			jquery    : __dirname + '/bower_components/jquery/dist/jquery.js',
			backbone  : __dirname + '/bower_components/backbone/backbone.js',
			underscore: __dirname + '/bower_components/underscore/underscore.js'
		}
	},
	module :{
		loaders: [
            { test: /\.css$/, loader: "style!css" },
            { test: /\.less$/, loader: 'style!css!less'},
            { test: /\.png$/, loader: 'url-loader?limit=8000&prefix=assets/&mimetype=image/png'},
            { test: /\.gif$/, loader: 'url-loader?limit=8000&prefix=assets/&mimetype=image/gif'},
            { test: /\.jpg$/, loader: 'url-loader?limit=8000&prefix=assets/&mimetype=image/jpg'}
        ]
	},
	devtool : 'sourcemap',
	debug   : true
};
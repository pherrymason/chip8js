"use strict";


var
$ = require('jquery'),
Backbone = require('backbone'),
_ = require('underscore'),

Keypad = function(keypad){
	this.keypad = keypad;
	this.listenting = false;
	this.map = [
	//	0 	1 	2 	3 
		90, 80, 67, 86,

	//	4	5	6	7
		65, 83, 68, 70,

	//	8	9	10	11
		81, 87, 69,	82,

	//	12	13	14	15
		49,	50,	51,	52
	];
};

Backbone.$ = $;
Keypad.prototype = _.extend(Keypad.prototype,Backbone.Events);

//var p = Keypad.prototype;

Keypad.prototype.listen = function(){
	if (!this.listening){
		document.addEventListener('keydown', this._keydown.bind(this));
		document.addEventListener('keyup', this._keyup.bind(this));
		this.listening = true;
	}
};

Keypad.prototype.ignore = function(){
	document.removeEventListener('keydown', this._keydown.bind(this));
	document.removeEventListener('keyup', this._keyup.bind(this));
};

Keypad.prototype._keydown = function(event){
	var key = event.keyCode,
	index = this.map.indexOf(key);

	if (index!=-1){
		this.keypress(index);
	}
};

Keypad.prototype._keyup = function(event){
	var key = event.keyCode,
	index = this.map.indexOf(key);

	if (index!=-1){
		this.keyup(index);
	}
};


Keypad.prototype.keypress = function(key){
	this.keypad[key] = 1;
	console.log(this.keypad);
	this.trigger('keypress',this.keypad);
};

Keypad.prototype.keyup = function(key){
	this.keypad[key] = 0;
	console.log(this.keypad);
	this.trigger('keyup',this.keypad);
};

module.exports = Keypad;
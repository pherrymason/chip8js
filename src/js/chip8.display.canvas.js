"use strict";


var
Display = function(canvas,options){
	this.canvas = canvas;
	this.context= this.canvas.getContext('2d');

	this.width = 64;
	this.height= 32;

	this.scaleX = this.canvas.width / this.width;
	this.scaleY = this.canvas.height/ this.height;

	this.clear();
};


/**
 * Clears screen
 */
Display.prototype.clear = function(){
	this.pixels = new Array(this.width*this.height);

	for (var i=0; i<this.width*this.height;i++){
		this.pixels[i] = 0;
	}

	this.context.fillStyle = '#000';
	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
};


/**
 * Puts a pixels in given coordinates
 * @param  {[type]} x [description]
 * @param  {[type]} y [description]
 * @return {[type]}   [description]
 */
Display.prototype.draw = function(x,y){

	if (x>this.width){
		x-= this.width;
	}
	else if (x<0){
		x+= this.width;
	}

	if (y>this.height){
		y-= this.height;
	}
	else if (y<0){
		y+= this.height; 
	}


	var active = false;
	this.pixels[(y*this.width)+x]^= 1;

	active = this.pixels[ (y*this.width)+x]==1? true:false;

	this.context.fillStyle = active? '#FFF':'#000';
	this.context.fillRect(x*this.scaleX, y*this.scaleY, this.scaleX, this.scaleY);
	return active;
};



module.exports = Display;
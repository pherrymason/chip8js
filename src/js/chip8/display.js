"use strict";


var
_ = require('underscore'),
Display = function(selectorID,options){

    var
    defaultOptions = {
        debug : false
    };

    this.options= _.extend({},defaultOptions,options);
	this.canvas = document.getElementById(selectorID);
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
console.log('clear');
	for (var i=0; i<this.width*this.height;i++){
		this.pixels[i] = 0;
	}

    if (this.options.debug){
        var turn = true;
        for (var x=0; x<this.width; x++) {
            for (var y=0; y<this.height; y++ ) {
                this.drawColor(x,y, turn? '#E6E6E6':'#FFFFFF');
                turn = !turn;
            }
            turn = !turn;
        }
    }
    else {
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
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
    active = this.pixels[ (y*this.width)+x] ^ 1;

    if (this.options.debug) {
        this.drawColor(x, y, active? '#FFF':'#F00');
    }
    else{
        this.drawColor(x, y, active? '#000':'#FFF');
        // this.context.fillStyle = ;
        // this.context.fillRect(x*this.scaleX, y*this.scaleY, this.scaleX, this.scaleY);
    }

    return active;
};


Display.prototype.drawColor = function(x,y,color) {
   //console.log('_drawColor('+x+'->'+this.scaleX+','+y+'->'+this.scaleY+','+color);
    this.context.fillStyle = color;
    this.context.fillRect(x*this.scaleX, y*this.scaleY, this.scaleX, this.scaleY);
};



module.exports = Display;
"use strict";

/**
 * Chip8 Emulator
 */
var
$ = require('jquery'),
Backbone = require('backbone'),
_ = require('underscore'),


/**
 * Constructor
 * @param Boolean debug.
 */
Chip8 = function(display,debug){
	this.timer		= null;
	this.debug		= debug;
	this.display	= display;
	this.cpuSpeed	= 100;	// Hz
	this.paused		= false;

	var keypad			= require('./chip8.keypad');
	this.keypadStatus	= [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	this.keypad			= new keypad(this.keypadStatus);

	this.keypad
		.on('keypress', function(args){
			this.keypadStatus = args[0];
		}.bind(this))
		.on('keyup', function(args){
			this.keypadStatus = args[0];
		}.bind(this));
};

Backbone.$ = $;
Chip8.prototype = _.extend(Chip8.prototype,Backbone.Events);

var p = Chip8.prototype;

/**
 * Initializes Chip8 Machine
 */
p.initialize = function(){

	this.memory	= new Uint8Array(new ArrayBuffer(4096));	// 4096 bytes of memory.

	this.V		= new Uint8Array(new ArrayBuffer(16));	// 16 CPU registers.

	this.I		= 0;					// Address register.
	this.pc		= 0x200;				// Program conuter starts at 0x200

	this.gfx	= new Uint8Array( new ArrayBuffer(64*32) );

	this.timerDelay = 0;
	this.timerSound = 0;

	// Stack
	// -----
	// Used to remember the current location before a jump is performed.
	// Any time program performs a jump or call a subrutine, program counter 
	// is stored in this stack before proceeding.
	// sp (stack pointer) is used to remember which level in the stack we are.
	this.stack		= [];//new Uint8Array(16);	// Stack
	this.sp			= 0;					// stack pointer

	this.keypadStatus= [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];	// Keypad state


	// flags
	this.draw		= false;		// Something has to be drawn on screen.
	this.clearScreen= false;		// Screen needs to be cleared.


	// Load fontset
	// 
	this.fontSet = [
		0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
		0x20, 0x60, 0x20, 0x20, 0x70, // 1
		0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
		0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
		0x90, 0x90, 0xF0, 0x10, 0x10, // 4
		0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
		0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
		0xF0, 0x10, 0x20, 0x40, 0x40, // 7
		0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
		0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
		0xF0, 0x90, 0xF0, 0x90, 0x90, // A
		0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
		0xF0, 0x80, 0x80, 0x80, 0xF0, // C
		0xE0, 0x90, 0x90, 0x90, 0xE0, // D
		0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
		0xF0, 0x80, 0xF0, 0x80, 0x80  // F
	];

	// Memory map
	// 0x000 - 0x1FF	Chip 8 interpreter (contains font set in emu)
	// 0x050 - 0x0A0	Used for the built in 4x5 pixel font set (0-F)
	// 0x200 - 0xFFF	Program ROM and work RAM
	for (var i=0;i<80; i++){
		this.memory[0x50+i] = this.fontSet[i];	
	}

	if(this.timer!==null){
		clearInterval(this.timer);
	}
};



/**
 * Loads a program into memory.
 * @param Uint8Array program: The program to be loaded.
 * @return {[type]} [description]
 */
p.loadProgram = function(program){
	this.initialize();

	var programLength = program.length;
	for( var i=0; i<programLength; i++ )
	{
		this.memory[0x200 + i] = program[i];
	}
};


p.start = function(restart){

	var
	interval = 1000/this.cpuSpeed;
	this.pc = typeof(restart)==='undefined'? 0x200:restart;
	this.keypad.listen();
	this.timer = setInterval( this._tick.bind(this), interval );
};


p.stop = function(){
	clearTimeout(this.timer);
	this.timer = null;
	this.pc = 0x200;
	this.keypad.ignore();
};


p.pause = function(){
	if (this.paused){
		console.log('start(false)');
		this.start(false);
	}
	else
	{
		console.log('stop()');
		this.stop();
	}
	this.paused!=this.paused;
}



// Private methods

/**
 * One cycle of execution.
 *
 */
p._tick = function(){

	// Read opcode
	var
	opcode = (this.memory[this.pc] << 8);
	opcode|= this.memory[this.pc+1];

//console.log( this.memory[this.pc].toString(16), this.memory[this.pc+1].toString(16), '0x'+opcode.toString(16) );

	this._executeOpcode(opcode);
};


p._incrementPC = function(){
	this.pc+= 2;
};

p._executeOpcode = function(opcode){

	if(this.debug){
		var description = '';
	}

	var
	X 	= (opcode & 0x0F00)>>8,
	Y	= (opcode & 0x00F0)>>4,
	N	= opcode & 0x000F,
	NN	= opcode & 0x00FF,
	NNN	= opcode & 0x0FFF;

	if(this.debug){
		this.trigger('debug.opcode',[opcode]);
	}

	// Read first 4 bits from opcode
	switch(opcode & 0xF000){

		case 0x0000:
					// 0x00E0: Clears the screen.
					// 0x00EE: Returns from subroutine.
					// 0x0NNN Calls RCA 1802 program at address NNN.
					switch( opcode )
					{
						// clears the screen
						case 0x00E0:
									this.clearScreen = true;
									this._incrementPC();
									this.debug && (description = 'Clears screen');
									break;

						// Returns from subroutine
						case 0x00EE:
									this.pc = this.stack.pop();
									this.debug && (description = 'Returns from subroutine');
									break;

						default:	// 0x0NNN
									this._incrementPC();
									this.debug && (description = 'Calls RCA 1802 program at 0x' + NNN.toString(16).toUpperCase() );
					}
					break;

		// Jumps to address NNN
		// 0x1NNN
		case 0x1000:
					this.pc = NNN;
					this.debug && (description = 'Jumps to '+NNN.toString(16));
					break;


		// Calls subroutine at NNN
		// 0x2NNN
		case 0x2000:
					this.stack.push(this.pc+2);
					this.pc = NNN;
					this.debug && (description = 'Call subroutine at '+NNN.toString(16));
					break;


		// Skips the next instruction if VX equals NN
		// 0x3XNN
		case 0x3000:
					if( this.V[ X ] == NN )
					{
						this._incrementPC();
						this._incrementPC();
						this.debug && (description = 'Skips next instruction cause V['+X+']==0x'+NN.toString(16));
					}
					else
					{
						this._incrementPC();
					}
					break;


		// Skips the next instruction if VX doesn't equal NN
		// 0x4XNN
		case 0x4000:
					if( this.V[ X ] != NN )
					{
						this._incrementPC();
						this._incrementPC();
						this.debug && (description = 'Skips next instruction cause V['+X+']!=0x'+NN.toString(16));
					}
					else
					{
						this._incrementPC();
						this.debug && (description = 'Does not skip next instruction cause V['+X+']==0x'+NN.toString(16));
					}
					break;


		// Skips the next instruction if VX equals VY
		// 0x5XY0
		case 0x5000:
					if( this.V[ X ]==this.V[ Y ] )
					{
						this._incrementPC();
						this._incrementPC();
						this.debug && (description = 'Skips the next instruction case V['+X+']==V['+Y+']');
					}
					else
					{
						this._incrementPC();
					}
					break;

		// Sets VX to NN
		// 0x6XNN
		case 0x6000:
					this.V[ X ] = NN;
					this._incrementPC();
					this.debug && (description = 'Sets V[' + X + '] to ' + NN.toString(16));
					break;


		// Adds NN to VX
		// 0x7XNN
		case 0x7000:
					this.V[ X ]+= NN;
					this._incrementPC();
					this.debug && (description = 'Adds '+NN.toString(16)+' to V[' + X + ']');
					break;


		case 0x8000:
					switch( opcode&0x000F )
					{
						// 8XY0	Sets VX to the value of VY.
						case 0:
								this.V[X] = this.V[Y];
								this.debug && (description = 'Sets V['+X+'] to V['+Y+']');
								break;
	
						// 8XY1	Sets VX to "VX OR VY".
						case 1:
								this.V[X]|= this.V[Y];
								this.debug && (description = 'Sets V['+X+'] to "V['+X+'] OR V['+Y+']"');
								break;
		
						// 8XY2	Sets VX to "VX AND VY".
						case 2:
								this.V[X]&= this.V[Y];
								this.debug && (description = 'Sets V['+X+'] to "V['+X+'] AND V['+Y+']"');
								break;

						// 8XY3	Sets VX to "VX xor VY".
						case 3:
								this.V[X]^= this.V[Y];
								this.debug && (description = 'Sets V['+X+'] to "V['+X+'] XOR V['+Y+']"');
								break;

						// 8XY4	Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
						case 4:
								if( this.V[Y] > (0xFF - this.V[X]) )
								{
									this.V[0xF] = 1;	// Carry.
								}
								else
								{
									this.V[0xF] = 0;	// No carry.
								}
								this.V[Y]+= this.V[X];
								this.debug && (description = 'Add V['+X+'] to V['+Y+']. VF carries');
								break;

						// 8XY5	VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
						case 5:
								if( this.V[Y] > this.V[X] )
								{
									this.V[0xF] = 0;	// Borrow.
								}
								else
								{
									this.V[0xF] = 1;	// No borrow.
								}
								this.V[X]-= this.V[Y];
								this.debug && (description = 'Substracts V['+X+'] - V['+Y+']. VF borrows');
								break;

						// 8XY6	Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift.[2]
						case 6:
								this.V[0xF] = this.V[X] & 0x1; 
								this.V[X] >>= 1;
								this.debug && (description = 'Shifts V['+X+']>>1. VF.');
								break;

						// 8XY7	Sets VX to (VY minus VX). VF is set to 0 when there's a borrow, and 1 when there isn't.
						case 7:
								if( this.V[Y] > this.V[X] )
								{
									this.V[0xF] = 0;	// Borrow.
								}
								else
								{
									this.V[0xF] = 1;	// No Borrow.
								}
								this.V[X] = this.V[Y]-this.V[X];
								this.debug && (description = 'Sets V['+X+'] = V['+Y+']-V['+X+']. VF borrows.');
								break;

						// 8XYE	Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift.[2]
						case 0x0E:
								this.V[0xF] = this.V[0xF]>>7;
								this.V[X]<<= 1;
								this.debug && (description = 'Shifts V['+X+']<<1. VF.');
								break;
					}
					this._incrementPC();
					break;

		// Skips the next instruction if VX doesn't equal VY.
		// 0x9XY0
		case 0x9000:
					if( this.V[ X ] != this.V[ Y ] )
					{
						this._incrementPC();
						this._incrementPC();
						this.debug && (description = 'Skips next instruction cause V['+X+'] != V['+Y+']');
					}
					else
					{
						this._incrementPC();
					}
					break;


		// Sets this.I to the address NNN.
		// 0xANNN
		case 0xA000:
					this.I = NNN;
					this._incrementPC();
					this.debug && (description = 'Sets I to the address '+NNN.toString(16));
					break;


		// Jumps to the address NNN plus V0.
		// 0xBNNN
		case 0xB000:
					this.pc = NNN + this.V[0];
					this.debug && (description = 'Jumps to address '+NNN.toString(16)+' plus V[0]');
					break;


		// Sets VX to a "random number AND NN).
		// 0xCXNN
		case 0xC000:
					this.V[ X ] = (Math.random() * (0xFF +1)) && NN;
					this._incrementPC();
					this.debug && (description = 'Sets V['+X+'] to a random number ('+this.V[X]+')');
					break;


		// Draws a sprite at coordinate (VX,VY) that has a width of 8 pixels and a height of N pixels.
		// Each row of 8 pixels is read as bit-coded starting form memory location I.
		// I value doesn't change after the execution of this instruction
		// VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn,
		// and to 0 if that doesn't happen.
		// All drawing is XOR drawing (i.e. it toggles the screen pixels)
		// 0xDXYN
		case 0xD000:
					this._drawSprite( this.V[X], this.V[Y], this.I, N );
					this._incrementPC();
					this.debug && (description = 'Draws sprite');
					break;


		// 
		case 0xE000:
					switch( opcode&0x0FF )
					{
						// EX9E	Skips the next instruction if the key stored in VX is pressed.
						case 0x9E:
								if (this.keypadStatus[ this.V[X] ]==1){
									this._incrementPC();
								}
								break;

						// EXA1	Skips the next instruction if the key stored in VX isn't pressed.
						case 0xA1:
								if (this.keypadStatus[ this.V[X] ]==0){
									this._incrementPC();
								}
					}

					this._incrementPC();
					this.debug && (description = '????');
					break;


		case 0xF000:
					switch (opcode&0x00FF){
						// FX07	Sets VX to the value of the delay timer.
						case 0x07:
									this.V[X] = this.timerDelay;
									this.debug && (description = 'sets V[X] the value of timer delay.');
									break;

						// FX0A	A key press is awaited, and then stored in VX.
						case 0x0A:
									this.debug && (description = 'Waits for keypress.');
									var keypress = false;
									for (var i=0; i<16; i++){
										if (this.keypadStatus[i]!=0){
											this.V[X] = i;
											keypress = true;
										}
									}
									if (!keypress){
										this.pc-= 2;
									}
									break;

						// FX15	Sets the delay timer to VX.
						case 0x15:
									this.timerDelay = this.V[X];
									this.debug && (description = 'Sets the delay timer to V[X].');
									break;

						// FX18	Sets the sound timer to VX.
						case 0x18:
									this.timerSound = this.V[X];
									this.debug && (description = 'Sets the sound timer to V[X].');
									break;

						// FX1E	Adds VX to I.[3]
						case 0x1E:
									this.I+= this.V[X];
									this.V[0xF] = ((this.I+this.V[X]) > 0xFFF)? 1:0;
									this.debug && (description = 'Adds V[X] to I.');
									break;

						// FX29	Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font.
						case 0x29:
									this.I = this.V[X] * 0x5;	// ????
									this.debug && (description = 'Sets I to the location of the sprite.');
									break;

						// FX33	Stores the Binary-coded decimal representation of VX, with the most significant of three digits at the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2. (In other words, take the decimal representation of VX, place the hundreds digit in memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.)
						case 0x33:
									this.memory[ this.I ]		= this.V[X] / 100;
									this.memory[ this.I + 1]	= (this.V[X] / 10) % 10;
									this.memory[ this.I + 2]	= (this.V[X] % 100) % 10;
									this.debug && (description = 'Stores binary coded decimal');
									break;
						// FX55	Stores V0 to VX in memory starting at address I.[4]
						case 0x55:
									for (var i=0; i<X; i++){
										this.memory[ this.I + i ] = this.V[i];
									}
									this.I+= X+1;
									this.debug && (description = 'Fills V[0] to V['+X+'] in memory from '+this.I);
									break;

						// FX65	Fills V0 to VX with values from memory starting at address I.[4]
						case 0x65:
									for (var i=0; i<=X; i++){
										this.V[i] = this.I + i;
									}
									this.I+= X+1;
									this.debug && (description = 'Fills V[0] to V['+X+'] with memory from '+this.I);
									break;
					}
					this._incrementPC();
					break;

		default:
				this.debug && (description = 'Unknown opcode');
				break;
	}


	if (this.timerDelay>0){
		this.timerDelay--;
	}

	if (this.timerSound>0){
		console.log('BEEP!');
		this.timerSound--;
	}

	if (this.clearScreen){
		this.display.clear();
		this.clearScreen = false;
	}
};



/**
 * 
 *	Display n-byte sprite starting at memory `address` at (x, y).
 *	Returns true if there's a collision.
 *
 *	Eg.:
 *
 *	Assuming the following sprite in memory at address 0x21A:
 *
 *	   Addr   Byte     Bits    Pixels
 *	   0x21A  0xF0   11110000  ****
 *	   0x21B  0x90   10010000  *  *
 *	   0x21C  0x90   10010000  *  *
 *	   0x21D  0x90   10010000  *  *
 *	   0x21E  0xF0   11110000  ****
 *
 *	Calling:
 *
 *	   vm.drawSprite(2, 3, 0x21A, 5)
 *
 *	Will draw a big 0 on the display at (2, 3).
*/
p._drawSprite = function(x, y, address, height){
//	debugger;
	var collision = false;

	// Walk horizontal lines
	for (var yLine=0; yLine<height; yLine++)
	{
		// Get sprite data stored in memory
		var pixel = this.memory[address + yLine];

		for (var xLine=7; xLine>=0; xLine--)
		{
			if (pixel & 1){
				this.display.draw(x+xLine, y+yLine);
			}

			pixel>>= 1;
		}
	}
	this.draw = true;
	this.trigger('draw',this.gfx);
};



p.opcodeDescription = function(pc,hex){

	var opcode = this.memory[pc]<<8;
	opcode |= this.memory[pc+1];

	var	x   = (opcode & 0x0F00) >> 8
	var y   = (opcode & 0x00F0) >> 4
	var nnn = opcode & 0x0FFF
	var kk  = opcode & 0x00FF
	var n   = opcode & 0x000F
	// Formated operands
	var xHex   = hex(x)
	var yHex   = hex(y)
	var nnnHex = hex(nnn, 3)
	var kkHex  = hex(kk, 2)
	var nHex   = hex(n & 0x000F, 1)

	switch (opcode & 0xf000)
	{
		case 0x0000:
			switch (opcode)
			{
				case 0x00E0:
					return "00E0 - Clear the display";
				case 0x00EE:
					return "00E0 - Return from a subroutine";
			}
			return null

		case 0x1000:
			if (nnn < 0x200){
				return null;
			}
			return "1nnn - Jump to address " + nnnHex;

		case 0x2000:
			if (nnn < 0x200) {
				return null;
			}
			return "2nnn - Call subroutine at " + nnnHex;
		case 0x3000:
			return "3xkk - Skip next instruction if V" + xHex + " = " + kkHex;
		case 0x4000:
			return "4xkk - Skip next instruction if V" + xHex + " != " + kkHex;
		case 0x6000:
			return "6xkk - Set V" + xHex + " = " + kkHex;
		case 0x7000:
			return "7xkk - Set V" + xHex + " = V" + xHex + " + " + kkHex;

		case 0x8000:
					switch( opcode&0x000F )
					{
						case 0:	return 'Sets V['+xHex+'] to V['+yHex+']';
	
						case 1:	return 'Sets V['+xHex+'] to "V['+xHex+'] OR V['+yHex+']"';
		
						case 2:	return 'Sets V['+xHex+'] to "V['+xHex+'] AND V['+yHex+']"';

						case 3:	return 'Sets V['+xHex+'] to "V['+xHex+'] xHexOR V['+yHex+']"';

						case 4:	return 'Add V['+xHex+'] to V['+yHex+']. VF carries';

						case 5:	return 'Substracts V['+xHex+'] - V['+yHex+']. VF borrows';

						case 6:	return 'Shifts V['+xHex+']>>1. VF.';

						case 7:	return 'Sets V['+xHex+'] = V['+yHex+']-V['+xHex+']. VF borrows.';

						case 0x0E:	return 'Shifts V['+xHex+']<<1. VF.';
					}
					break;

		case 0xa000:
			if (nnn < 0x200){
				return null;
			}
			return "Annn - Set I = " + nnnHex;
		case 0xc000:
			return "Cxkk - Set V" + xHex + " = random byte AND " + kkHex;
		case 0xd000:
			return "Dxyn - Draw sprite in I..I+" + n + " at (V" + xHex + ",V" + yHex + ")";
		case 0xF000:
			switch (opcode & 0x00FF) {
				case 0xF01E:
					return "Fx1E - Set I = I + V" + xHex;

				case 0x07:
						return 'sets V[X] the value of timer delay.';

				case 0x0A:
						return 'Waits for keypress.';

				case 0x15:
						return 'Sets the delay timer to V[X].';

				case 0x18:
						return 'Sets the sound timer to V[X].';

				case 0x1E:
						return 'Adds V[X] to I.';

				case 0x29:
						return 'Sets I to the location of the sprite.';

				case 0x33:
						return 'Stores binary coded decimal';

				case 0x55:
						return 'Fills V[0] to V['+xHex+'] in memory from '+this.I;

				case 0x65:
						return 'Fills V[0] to V['+xHex+'] with memory from '+this.I;
			}
			return null;

		default:
			return null;
	}
}

module.exports = Chip8;
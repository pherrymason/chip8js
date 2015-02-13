/**
 * Chip8 Emulator for JS
 * ---------------------
 */
"use strict";

var
$       = require('jquery'),
Chip8   = require('./chip8/chip8'),
vm		= new Chip8({
    displayID : 'screen',
    debuggerID: 'debugger'
});

$('.keypad').on('click', '.btn', function(event){
	var $btn = $(event.currentTarget);
	if ($btn.hasClass('active')){
		vm.keypad.keyup($btn.data('btn'));
		$btn.removeClass('active');
	}
	else{
		vm.keypad.keypress($btn.data('btn'));
		$btn.addClass('active');
	}
});
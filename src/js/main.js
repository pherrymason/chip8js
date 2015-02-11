/**
 * Chip8 Emulator for JS
 * ---------------------
 */
"use strict";


var
Chip8Display = require('./chip8.display.canvas'),
Chip8 = require('./chip8'),

$		= require('jquery'),
display	= new Chip8Display(document.getElementById('screen')),
debug	= true,
vm		= new Chip8(display,debug);


if( debug )
{
	vm.on('debug.opcode', updateDebug);
}


$('#file-input').on('change', function(event){
	var file = event.target.files[0];
	if (!file){
		return;
	}

	var reader = new FileReader();
	reader.onload = function(e){
		var contents = new Uint8Array(e.target.result);
		vm.loadProgram(contents);
		fillProgramTable();
	};
	reader.readAsArrayBuffer(file);
});



$('.btn-start').on('click', function(){
	vm.start();
})

$('.btn-pause').on('click', function(){
	vm.pause();
});

$('.btn-stop').on('click', function(){
	console.log('to stop');
	vm.stop();
});

$('.btn-step').on('click', function(){
	vm._tick();
})

var $trs = null;
function updateDebug(args){
	$trs.removeClass('current');
	$trs.filter('#adr-'+vm.pc).addClass('current');

	// Timer
	$('.timer-delay').text( vm.timerDelay );
	$('.sound-delay').text( vm.timerSound );

	// VM
	$('.v0').text( toHex( vm.V[0] ) );
	$('.v1').text( toHex( vm.V[1] ) );
	$('.v2').text( toHex( vm.V[2] ) );
	$('.v3').text( toHex( vm.V[3] ) );
	$('.v4').text( toHex( vm.V[4] ) );
	$('.v5').text( toHex( vm.V[5] ) );
	$('.v6').text( toHex( vm.V[6] ) );
	$('.v7').text( toHex( vm.V[7] ) );
	$('.v8').text( toHex( vm.V[8] ) );
	$('.v9').text( toHex( vm.V[9] ) );
	$('.v10').text( toHex( vm.V[10] ) );
	$('.v11').text( toHex( vm.V[11] ) );
	$('.v12').text( toHex( vm.V[12] ) );
	$('.v13').text( toHex( vm.V[13] ) );
	$('.v14').text( toHex( vm.V[14] ) );
	$('.v15').text( toHex( vm.V[15] ) );
	$('.I').text( toHex(vm.I) );
}



function fillProgramTable()
{
	var
	end = false,
	html= '',
	zeroes = 0,
	pc  = 0x200;

	while (!end){

		var 
		opcode = vm.memory[pc]<<8;
		opcode|= vm.memory[pc+1];

		zeroes = ( opcode==0 )? zeroes+1:0;

		html+=
		'<tr id="adr-'+pc+'">'+
		'<td>' + toHex(pc) + '</td>' +
		'<td>' + toHex(opcode) + '</td>' +
		'<td>' + vm.opcodeDescription(pc,toHex) + '</td>' +
		'</tr>';
		pc+=2;

		if (zeroes>=4){
			end = true;
		}
	}

	$trs = $('.table tbody').html(html).find('tr');
}

function toHex(num,pad){

	num = num.toString(16).toUpperCase();
	if (pad) {
		var s = num + "";
		while (s.length < pad){
			s = "0" + s;
		}

		return '0x'+s;
	}

	return '0x'+num;
}
/**
 * Chip8 Emulator for JS
 * ---------------------
 */
import React from "react";
import ReactDOM from "react-dom";
import Emulator from "./Emulator/Emulator";


var $       = require('jquery');
/*var vm      = new Chip8({
    displayID : 'screen',
    debuggerID: 'debugger',
    debugDisplay: false
});
*/
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

if (!compatibilityCheck()) {

} else {
    ReactDOM.render(<Emulator/>, document.getElementById('emulator'));
}



function compatibilityCheck() {
    if (typeof window.FileReader !== 'function') {
        alert("The file API isn't supported on this browser yet.");
        return false;
    }

    return true;
}
"use strict";


export default class Keypad {
    construct(keypad) {
        this.keypad = keypad;
        this.listenting = false;
        this.map = [
            //	0 	1 	2 	3
            90, 88, 67, 86,

            //	4	5	6	7
            65, 83, 68, 70,

            //	8	9	10	11
            81, 87, 69, 82,

            //	12	13	14	15
            49, 50, 51, 52
        ];
    }

	listen() {
        if (!this.listening) {
            document.addEventListener('keydown', this._keydown.bind(this));
            document.addEventListener('keyup', this._keyup.bind(this));
            this.listening = true;
        }
    }

    ignore() {
        document.removeEventListener('keydown', this._keydown.bind(this));
        document.removeEventListener('keyup', this._keyup.bind(this));
    }

    _keydown(event) {
        var key = event.keyCode,
            index = this.map.indexOf(key);
        console.log(key);
        if (index != -1) {
            this.keypress(index);
        }
    }

    _keyup(event) {
        var key = event.keyCode,
            index = this.map.indexOf(key);

        if (index != -1) {
            this.keyup(index);
        }
    }

    keypress(key) {
        this.keypad[key] = 1;
        //console.log(this.keypad);
        this.trigger('keypress', this.keypad);
    }

   	keyup(key) {
        this.keypad[key] = 0;
        //console.log(this.keypad);
        this.trigger('keyup', this.keypad);
    }
}

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

        this.reset();
    }

    reset() {
        this.keypadStatus = Array(19).fill(0);
    }

	listen() {
        if (!this.listening) {
            document.addEventListener('keydown', () => this._keydown);
            document.addEventListener('keyup', () => this._keyup);
            this.listening = true;
        }
    }

    ignore() {
        document.removeEventListener('keydown', () => this._keydown);
        document.removeEventListener('keyup', () => this._keyup);
    }

    _keydown(event) {
        const key = event.keyCode;
        const index = this.map.indexOf(key);
        console.log(key);
        if (index !== -1) {
            this.keypress(index);
        }
    }

    _keyup(event) {
        const key = event.keyCode;
        const index = this.map.indexOf(key);

        if (index !== -1) {
            this.keyup(index);
        }
    }

    keypress(key) {
        this.keypad[key] = 1;
        this.trigger('keypress', this.keypad);
    }

   	keyup(key) {
        this.keypad[key] = 0;
        this.trigger('keyup', this.keypad);
    }
}

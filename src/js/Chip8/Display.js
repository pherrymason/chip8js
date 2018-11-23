"use strict";


export default class Display {
    constructor(memory, selectorID, options) {
        const defaultOptions = {
            debug: false
        };

        this.memory = memory;
        this.options = Object.assign({}, defaultOptions, options);
        this.canvas = document.getElementById(selectorID);
        this.context = this.canvas.getContext('2d');

        this.width = 64;
        this.height = 32;

        this.scaleX = this.canvas.width / this.width;
        this.scaleY = this.canvas.height / this.height;

        this.loadFontSet();

        this.clear();
    }

    loadFontSet() {
        const fontSet = [
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
        for (let i = 0; i < fontSet.length; i++) {
            this.memory.write(0x50 + i, fontSet[i]);
        }
    }

    /**
     * Clears screen
     */
    clear() {
        this.pixels = new Array(this.width * this.height);
        for (let i = 0; i < this.width * this.height; i++) {
            this.pixels[i] = 0;
        }

        if (this.options.debug) {
            let turn = true;
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    this.drawColor(x, y, turn ? '#E6E6E6' : '#FFFFFF');
                    turn = !turn;
                }
                turn = !turn;
            }
        } else {
            this.context.fillStyle = '#000';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Puts a pixels in given coordinates
     * @param  {[type]} x [description]
     * @param  {[type]} y [description]
     * @return {boolean}   [description]
     */
    draw(x, y) {
        if (x > this.width) {
            x -= this.width;
        } else if (x < 0) {
            x += this.width;
        }

        if (y > this.height) {
            y -= this.height;
        } else if (y < 0) {
            y += this.height;
        }

        this.pixels[(y * this.width) + x] ^= 1;
        const active = this.pixels[(y * this.width) + x] ^ 1;

        if (this.options.debug) {
            this.drawColor(x, y, active ? '#FFF' : '#F00');
        } else {
            this.drawColor(x, y, active ? '#000' : '#FFF');
        }

        return active;
    }

    drawColor(x, y, color) {
        this.context.fillStyle = color;
        this.context.fillRect(x * this.scaleX, y * this.scaleY, this.scaleX, this.scaleY);
    }

    drawSprite(x, y, address, height) {
        let collision = false;

        // Walk horizontal lines
        for (let yLine = 0; yLine < height; yLine++) {
            // Get sprite data stored in memory
            let pixel = this.memory.read(address + yLine);

            for (let xLine = 7; xLine >= 0; xLine--) {
                if (pixel & 1) {
                    if (this.draw(x + xLine, y + yLine)) {
                        collision = true;
                    }
                }

                pixel >>= 1;
            }
        }

        return collision;
    }
}
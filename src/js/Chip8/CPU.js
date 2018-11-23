export default class CPU {
    constructor(memory, keypad, video, debug = false) {
        this.debug = debug;
        this.memory = memory;
        this.keypad = keypad;
        this.video = video;
        this.cpuSpeed = 100;  // Hz

        this.reset();
        this.timer = null;
    }

    reset() {
        this.memory.reset();

        // 16 CPU registers.
        this.V = new Uint8Array(new ArrayBuffer(16));

        // Address register.
        this.I = 0;

        // Program Counter
        this.pc = 0x200;

        this.stack = [];
        this.sp = 0;        // Stack pointer
    }

    start() {
        const interval = 1000 / this.cpuSpeed;
        this.timer = setInterval(() => this.tick(), interval);
    }

    stop() {
        clearTimeout(this.timer);
    }

    tick() {
        let opcode = (this.memory.read(this.pc) << 8);
        opcode |= this.memory.read(this.pc + 1);

        this.executeOpcode(opcode);
    }

    incrementPC() {
        this.pc += 2;
    }

    executeOpcode(opcode) {
        let description = '';

        const X = (opcode & 0x0F00) >> 8;
        const Y = (opcode & 0x00F0) >> 4;
        const N = opcode & 0x000F;
        const NN = opcode & 0x00FF;
        const NNN = opcode & 0x0FFF;

        if (this.debug) {
            this.eventManager.trigger('debug.opcode', [opcode]);
        }

        // Read first 4 bits from opcode
        switch (opcode & 0xF000) {

            case 0x0000:
                // 0x00E0: Clears the screen.
                // 0x00EE: Returns from subroutine.
                // 0x0NNN Calls RCA 1802 program at address NNN.
                switch (opcode) {
                    // clears the screen
                    case 0x00E0:
                        this.clearScreen = true;
                        this.incrementPC();
                        break;

                    // Returns from subroutine
                    case 0x00EE:
                        this.pc = this.stack.pop();
                        break;

                    // (S)chip Set SCHIP graphic mode
                    //case 0x00FF:
                    //
                    //           break;

                    default:	// 0x0NNN
                        //'Calls RCA 1802 program at 0x' + NNN );
                        this.incrementPC();
                        break;
                }
                break;

            // Jumps to address NNN
            // 0x1NNN
            case 0x1000:
                this.pc = NNN;
                break;

            // Calls subroutine at NNN
            // 0x2NNN
            case 0x2000:
                this.stack.push(this.pc + 2);
                this.pc = NNN;
                break;


            // Skips the next instruction if VX equals NN
            // 0x3XNN
            case 0x3000:
                if (this.V[X] === NN) {
                    this.incrementPC();
                    this.incrementPC();
                } else {
                    this.incrementPC();
                }
                break;


            // Skips the next instruction if VX doesn't equal NN
            // 0x4XNN
            case 0x4000:
                if (this.V[X] !== NN) {
                    this.incrementPC();
                    this.incrementPC();
                } else {
                    this.incrementPC();
                }
                break;


            // Skips the next instruction if VX equals VY
            // 0x5XY0
            case 0x5000:
                if (this.V[X] === this.V[Y]) {
                    this.incrementPC();
                    this.incrementPC();
                } else {
                    this.incrementPC();
                }
                break;

            // Sets VX to NN
            // 0x6XNN
            case 0x6000:
                this.V[X] = NN;
                this.incrementPC();
                break;


            // Adds NN to VX
            // 0x7XNN
            case 0x7000:
                this.V[X] = (this.V[X] + NN) & 0xFF;
                this.incrementPC();
                break;


            case 0x8000:
                switch (opcode & 0x000F) {
                    // 8XY0	Sets VX to the value of VY.
                    case 0:
                        this.V[X] = this.V[Y];
                        break;

                    // 8XY1	Sets VX to "VX OR VY".
                    case 1:
                        this.V[X] |= this.V[Y];
                        break;

                    // 8XY2	Sets VX to "VX AND VY".
                    case 2:
                        this.V[X] &= this.V[Y];
                        break;

                    // 8XY3	Sets VX to "VX xor VY".
                    case 3:
                        this.V[X] ^= this.V[Y];
                        break;

                    // 8XY4	Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
                    case 4:
                        if ((this.V[Y] + this.V[X]) > 0xFF) {
                            this.V[0xF] = 1;	// Carry.
                        } else {
                            this.V[0xF] = 0;	// No carry.
                        }
                        this.V[X] += this.V[Y];
                        break;

                    // 8XY5	VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                    case 5:
                        if (this.V[Y] > this.V[X]) {
                            this.V[0xF] = 0;	// Borrow.
                        } else {
                            this.V[0xF] = 1;	// No borrow.
                        }
                        this.V[0xF] = (this.V[X] >= this.V[Y]) ? 1 : 0;
                        this.V[X] -= this.V[Y];
                        break;

                    // 8XY6	Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift.[2]
                    case 6:
                        this.V[0xF] = this.V[X] & 0x1;
                        this.V[X] >>= 1;
                        break;

                    // 8XY7	Sets VX to (VY minus VX). VF is set to 0 when there's a borrow, and 1 when there isn't.
                    case 7:
                        if (this.V[Y] < this.V[X]) {
                            this.V[0xF] = 0;	// Borrow.
                        } else {
                            this.V[0xF] = 1;	// No Borrow.
                        }
                        this.V[X] = this.V[Y] - this.V[X];
                        break;

                    // 8XYE	Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift.[2]
                    case 0x0E:
                        this.V[0xF] = this.V[X] >> 7;
                        this.V[X] <<= 1;
                        break;
                }
                this.incrementPC();
                break;

            // Skips the next instruction if VX doesn't equal VY.
            // 0x9XY0
            case 0x9000:
                if (this.V[X] !== this.V[Y]) {
                    this.incrementPC();
                    this.incrementPC();
                } else {
                    this.incrementPC();
                }
                break;


            // Sets this.I to the address NNN.
            // 0xANNN
            case 0xA000:
                this.I = NNN;
                this.incrementPC();
                break;


            // Jumps to the address NNN plus V0.
            // 0xBNNN
            case 0xB000:
                this.pc = NNN + this.V[0];
                break;


            // Sets VX to a "random number AND NN".
            // 0xCXNN
            case 0xC000:
                var random = Math.random();
                random = random * (0xFF - 0) + 1;
                this.V[X] = (random & NN);
                this.incrementPC();
                break;


            // Draws a sprite at coordinate (VX,VY) that has a width of 8 pixels and a height of N pixels.
            // Each row of 8 pixels is read as bit-coded starting form memory location I.
            // I value doesn't change after the execution of this instruction
            // VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn,
            // and to 0 if that doesn't happen.
            // All drawing is XOR drawing (i.e. it toggles the screen pixels)
            // 0xDXYN
            case 0xD000:
                this.V[0xF] = this.video.drawSprite(this.V[X], this.V[Y], this.I, N) ? 1 : 0;
                this.incrementPC();
                break;


            //
            case 0xE000:
                switch (opcode & 0x0FF) {
                    // EX9E	Skips the next instruction if the key stored in VX is pressed.
                    case 0x9E:
                        if (this.keypadStatus[this.V[X]] === 1) {
                            this.incrementPC();
                        }
                        break;

                    // EXA1	Skips the next instruction if the key stored in VX isn't pressed.
                    case 0xA1:
                        if (this.keypadStatus[this.V[X]] === 0) {
                            this.incrementPC();
                        }
                }
                this.incrementPC();
                break;


            case 0xF000:
                switch (opcode & 0x00FF) {
                    // FX07	Sets VX to the value of the delay timer.
                    case 0x07:
                        this.V[X] = this.timerDelay;
                        break;

                    // FX0A	A key press is awaited, and then stored in VX.
                    case 0x0A:
                        let keypress = false;
                        for (let i = 0; i < 16; i++) {
                            if (this.keypadStatus[i] !== 0) {
                                this.V[X] = i;
                                keypress = true;
                            }
                        }
                        if (!keypress) {
                            //	this.pc-= 2;  //Force try again.
                        }
                        break;

                    // FX15	Sets the delay timer to VX.
                    case 0x15:
                        this.timerDelay = this.V[X];
                        break;

                    // FX18	Sets the sound timer to VX.
                    case 0x18:
                        this.timerSound = this.V[X];
                        break;

                    // FX1E	Adds VX to I.[3]
                    case 0x1E:
                        this.I += this.V[X];
                        this.V[0xF] = ((this.I + this.V[X]) > 0xFFF) ? 1 : 0;
                        break;

                    // FX29
                    // I is set the address for the hexadecimal character sprite referred to by the register VX 5 chars high
                    case 0x29:
                        this.I = this.V[X] * 5;
                        break;

                    // FX33	Stores the Binary-coded decimal representation of VX, with the most significant of three digits at the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2. (In other words, take the decimal representation of VX, place the hundreds digit in memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.)
                    case 0x33:
                        this.memory.write(this.I, this.V[X] / 100);
                        this.memory.write(this.I + 1, (this.V[X] / 10) % 10);
                        this.memory.write(this.I + 2, (this.V[X] % 100) % 10);
                        break;

                    // FX55	Stores V0 to VX in memory starting at address I.[4]
                    case 0x55:
                        for (let i = 0; i <= X; i++) {
                            this.memory.write(this.I + i, this.V[i]);
                        }
                        this.I += X + 1;
                        break;

                    // FX65	Fills V0 to VX with values from memory starting at address I.[4]
                    case 0x65:
                        for (let i = 0; i <= X; i++) {
                            this.V[i] = this.I + i;
                        }
                        this.I += X + 1;
                        break;
                }
                this.incrementPC();
                break;

            default:
                this.debug && (description = 'Unknown opcode');
                break;
        }
    }
}
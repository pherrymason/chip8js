import CPU from "./CPU";
import Keypad from "./Keypad";
import Display from "./Display";
import Debugger from "./../debugger/Debugger";
import EventAware from "./Event";
import Memory from "./Memory";

/**
 * Chip8 Emulator
 */

export default class Chip8 {
    constructor(options) {
        const defaultOptions = {
            displayID: 'screen',
            debuggerID: 'debugger',
            debug: false,
            debugDisplay: false
        };

        // Emulator stuff
        this.eventManager = new EventAware();
        this.options = Object.assign({}, defaultOptions, options);
        this.paused = false;


        // Machine internals
        this.timer = null;
        this.memory = new Memory();
        this.keypad = new Keypad();
        // Devices
        this.display = new Display(
            this.memory,
            this.options.displayID,
            {
                debug: this.options.debugDisplay
            }
        );

        this.cpu = new CPU(this.memory, this.keypad, this.display);

        this.debug = new Debugger();
        /*
                this.keypad = new Keypad(this.keypadStatus);
                this.display = new Display(this.options.displayID, {
                    debug: this.options.debugDisplay
                });
                this.debug = new Debug(this.options.debuggerID);

                this.keypad
                    .on('keypress', function (args) {
                        this.keypadStatus = args;
                    }.bind(this))
                    .on('keyup', function (args) {
                        this.keypadStatus = args;
                    }.bind(this));

                this.debug
                    .on('programLoaded', function (app) {
                        this.loadProgram(app);
                    }.bind(this))

                    .on('start', this.start.bind(this))
                    .on('stop', this.stop.bind(this))
                    .on('pause', this.pause.bind(this))
                    .on('step', this._tick.bind(this));
                    */
    }

    /**
     * Initializes Chip8 Machine
     */
    initialize() {
        this.cpu.reset();
        this.keypad.reset();

        // flags
        this.draw = false;		// Something has to be drawn on screen.
        this.clearScreen = false;		// Screen needs to be cleared.
    }

    /**
     * Loads a program into memory.
     * @param {Uint8Array} program: The program to be loaded.
     * @return {[type]} [description]
     */
    loadProgram(program) {
        this.initialize();
        const buffer = new Uint8Array(program);
        const programLength = program.byteLength;
        for (let i = 0; i < programLength; i++) {
            this.memory.write(0x200 + i, buffer[i]);
        }
    }

    start() {
        this.keypad.listen();
        this.cpu.start();
    }

    stop() {
        this.keypad.ignore();
    }

    reset() {
        this.cpu.reset();
        this.keypad.reset();
        this.display.clear();

        this.start();
    }

    pause() {
        if (this.paused) {
            console.log('start(false)');
            this.start(false);
        } else {
            console.log('stop()');
            this.stop();
        }
        this.paused = !this.paused;
    }
}
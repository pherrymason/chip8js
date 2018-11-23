export default class Memory {
    constructor() {
        // 4096 bytes of memory.
        this.memory = new Uint8Array(new ArrayBuffer(4096));
    }

    reset() {
        this.memory = new Uint8Array(new ArrayBuffer(4096));
    }

    read(address) {
        return this.memory[address];
    }

    write(address, value) {
        this.memory[address] = value;
    }
}
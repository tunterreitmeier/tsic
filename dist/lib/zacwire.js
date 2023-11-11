"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Zacwire = void 0;
const pigpio_1 = require("pigpio");
class Zacwire {
    lastLowTick = null;
    lastHighTick = null;
    strobeTime = null;
    receivedBits = [];
    firstPacket = null;
    secondPacket = null;
    constructor() { }
    setLastLowTick(value) {
        this.lastLowTick = value;
    }
    hasLowTick() {
        return this.lastLowTick !== null;
    }
    setLastHighTick(value) {
        this.lastHighTick = value;
    }
    hasHighTick() {
        return this.lastHighTick !== null;
    }
    lowTickDiff(tick) {
        if (this.lastLowTick === null) {
            throw new Error('did not receive a low tick yet');
        }
        return (0, pigpio_1.tickDiff)(this.lastLowTick, tick);
    }
    highTickDiff(tick) {
        if (this.lastHighTick === null) {
            throw new Error('did not receive a high tick yet');
        }
        return (0, pigpio_1.tickDiff)(this.lastHighTick, tick);
    }
    setStrobeTime(value) {
        this.strobeTime = value;
    }
    hasStrobeTime() {
        return this.strobeTime !== null;
    }
    getStrobeTime() {
        if (this.strobeTime === null) {
            throw new Error('did not receive a strobe time (calibration bit) yet');
        }
        return this.strobeTime;
    }
    appendBitToBuffer(bit) {
        this.receivedBits.push(bit);
    }
    startOfFirstPacket() {
        if (!this.checkParity()) {
            return this.reset();
        }
        this.secondPacket = this.bufferToInt();
        this.receivedBits = [];
        this.strobeTime = null;
    }
    startOfSecondPacket() {
        if (this.receivedBits.length !== 9) {
            return;
        }
        if (!this.checkParity()) {
            return this.reset();
        }
        this.firstPacket = this.bufferToInt();
        this.receivedBits = [];
        this.strobeTime = null;
    }
    getResult() {
        if (this.firstPacket === null || this.secondPacket === null) {
            return null;
        }
        return (this.firstPacket << 8) + this.secondPacket;
    }
    // checks whether the count of 1 bits is even
    checkParity() {
        if (this.receivedBits.length !== 9) {
            return false;
        }
        const parityBit = this.receivedBits.pop();
        return (this.receivedBits.reduce((acc, val) => acc + val, 0) % 2 === parityBit);
    }
    reset() {
        this.strobeTime = null;
        this.receivedBits = [];
        this.firstPacket = null;
        this.secondPacket = null;
    }
    bufferToInt() {
        return parseInt(this.receivedBits.join(''), 2);
    }
}
exports.Zacwire = Zacwire;

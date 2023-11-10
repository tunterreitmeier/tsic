"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tsic = void 0;
const pigpio_1 = require("pigpio");
const zacwire_1 = require("./lib/zacwire");
class Tsic {
    static TSIC_206 = {
        id: 206,
        maxTemperature: 150,
        minTemperature: -50,
    };
    static SENSORS = [Tsic.TSIC_206.id];
    dataPin;
    sensor;
    constructor(dataPin, sensorId = Tsic.TSIC_206.id) {
        if (!Tsic.SENSORS.includes(sensorId)) {
            throw new Error('This library does currently only support TSIC 206');
        }
        this.sensor = Tsic.TSIC_206;
        this.dataPin = new pigpio_1.Gpio(dataPin, {
            mode: pigpio_1.Gpio.INPUT,
            alert: true,
        });
    }
    getDataPin() {
        return this.dataPin;
    }
    getTemperature() {
        return new Promise((resolve) => {
            const zacWire = new zacwire_1.Zacwire();
            this.dataPin.on('alert', (level, tick) => {
                if (level === 1) {
                    zacWire.setLastHighTick(tick);
                    if (!zacWire.hasLowTick()) {
                        return;
                    }
                    const lowTickDiff = zacWire.lowTickDiff(tick);
                    // Calibration T-Strobe
                    if (!zacWire.hasStrobeTime()) {
                        zacWire.setStrobeTime(lowTickDiff);
                        return;
                    }
                    const receivedBit = lowTickDiff >= zacWire.getStrobeTime() ? 0 : 1;
                    zacWire.appendBitToBuffer(receivedBit);
                    return;
                }
                // Level changed to low
                zacWire.setLastLowTick(tick);
                if (!zacWire.hasHighTick()) {
                    const highTickDiff = zacWire.highTickDiff(tick);
                    if (highTickDiff > 1000) {
                        zacWire.startOfFirstPacket();
                        const result = zacWire.getResult();
                        if (result !== null) {
                            resolve(this.calculateTemperatureFromZacwire(result));
                        }
                        return;
                    }
                    if (highTickDiff >= 2 * zacWire.getStrobeTime()) {
                        zacWire.startOfSecondPacket();
                    }
                }
            });
        });
    }
    calculateTemperatureFromZacwire(result) {
        // Zacwire result is between 0 (minTemperature) and 2048 (maxTemperature)
        const temperatureRange = this.sensor.maxTemperature - this.sensor.minTemperature;
        return (result / 2048) * temperatureRange + this.sensor.minTemperature;
    }
}
exports.Tsic = Tsic;

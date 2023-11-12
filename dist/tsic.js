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
    dataPinNumber;
    sensor;
    constructor(dataPin, sensorId = Tsic.TSIC_206.id) {
        if (!Tsic.SENSORS.includes(sensorId)) {
            throw new Error('This library does currently only support TSIC 206');
        }
        this.sensor = Tsic.TSIC_206;
        this.dataPinNumber = dataPin;
        this.dataPin = new pigpio_1.Gpio(dataPin, {
            mode: pigpio_1.Gpio.INPUT,
            alert: true,
        });
    }
    getDataPin() {
        return this.dataPin;
    }
    getTemperature() {
        return new Promise((resolve, reject) => {
            const zacWire = new zacwire_1.Zacwire();
            const listener = (level, tick) => {
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
                    return;
                }
                const highTickDiff = zacWire.highTickDiff(tick);
                if (highTickDiff > 1000) {
                    zacWire.startOfFirstPacket();
                    const result = zacWire.getResult();
                    if (result !== null) {
                        this.dataPin.removeListener('alert', listener).disableAlert();
                        if (!this.resultSanityCheck(result)) {
                            return reject(`Something went wrong: Zacwire result (${result}) is out of range (0-2048)`);
                        }
                        return resolve(this.calculateTemperatureFromZacwire(result));
                    }
                    return;
                }
                if (zacWire.hasStrobeTime() &&
                    highTickDiff >= 2 * zacWire.getStrobeTime()) {
                    zacWire.startOfSecondPacket();
                }
            };
            this.enableTimeout(5000, listener, reject);
            this.dataPin.on('alert', listener);
        });
    }
    calculateTemperatureFromZacwire(result) {
        // Zacwire result is between 0 (minTemperature) and 2048 (maxTemperature)
        const temperatureRange = this.sensor.maxTemperature - this.sensor.minTemperature;
        return (result / 2048) * temperatureRange + this.sensor.minTemperature;
    }
    resultSanityCheck(result) {
        return result >= 0 && result <= 2048;
    }
    enableTimeout(timeoutInMs, listener, reject) {
        const timeoutInS = (timeoutInMs / 1000).toFixed(0);
        const timeOut = setTimeout(() => {
            reject('Did not receive any data from TSIC within ' +
                timeoutInS +
                ' seconds.\n' +
                "Have you connected the sensor's data pin to GPIO " +
                this.dataPinNumber +
                ' and correctly powered the sensor?\n');
            this.dataPin.removeListener('alert', listener).disableAlert();
        }, timeoutInMs);
        timeOut.unref();
        this.dataPin.once('alert', () => clearTimeout(timeOut));
    }
}
exports.Tsic = Tsic;

import { Gpio } from 'pigpio';
import { Zacwire } from './lib/zacwire';

type SensorId = number;

type Sensor = {
  id: SensorId;
  maxTemperature: number;
  minTemperature: number;
};

export class Tsic {
  static readonly TSIC_206: Sensor = {
    id: 206,
    maxTemperature: 150,
    minTemperature: -50,
  };

  static readonly SENSORS = [Tsic.TSIC_206.id];

  private dataPin: Gpio;

  private sensor: Sensor;

  constructor(dataPin: number, sensorId: SensorId = Tsic.TSIC_206.id) {
    if (!Tsic.SENSORS.includes(sensorId)) {
      throw new Error('This library does currently only support TSIC 206');
    }

    this.sensor = Tsic.TSIC_206;

    this.dataPin = new Gpio(dataPin, {
      mode: Gpio.INPUT,
      alert: true,
    });
  }

  getDataPin(): Gpio {
    return this.dataPin;
  }

  getTemperature(): Promise<number> {
    return new Promise((resolve, reject) => {
      const zacWire = new Zacwire();

      const timeOut = setTimeout(function () {
        reject('Did not receive any data from TSIC within 5 seconds');
      }, 5000);
      timeOut.unref();

      this.dataPin.once('alert', () => clearTimeout(timeOut));

      const listener = (level: 0 | 1, tick: number) => {
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
              return reject(
                `Something went wrong: Zacwire result (${result}) is out of range (0-2048)`,
              );
            }
            return resolve(this.calculateTemperatureFromZacwire(result));
          }
          return;
        }

        if (
          zacWire.hasStrobeTime() &&
          highTickDiff >= 2 * zacWire.getStrobeTime()
        ) {
          zacWire.startOfSecondPacket();
        }
      };

      this.dataPin.on('alert', listener);
    });
  }

  private calculateTemperatureFromZacwire(result: number): number {
    // Zacwire result is between 0 (minTemperature) and 2048 (maxTemperature)
    const temperatureRange =
      this.sensor.maxTemperature - this.sensor.minTemperature;
    return (result / 2048) * temperatureRange + this.sensor.minTemperature;
  }

  private resultSanityCheck(result: number): boolean {
    return result >= 0 && result <= 2048;
  }
}

import { Gpio } from 'pigpio';
import { Zacwire } from './lib/zacwire';

interface Sensor {
  id: number;
  maxTemperature: number;
  minTemperature: number;
}

export class Tsic {
  static readonly TSIC_206: Sensor = {
    id: 206,
    maxTemperature: 150,
    minTemperature: -50,
  };

  static readonly SENSORS = [Tsic.TSIC_206.id];

  private dataPin: Gpio;

  private sensor: Sensor;

  constructor(dataPin: number, sensorId: number = Tsic.TSIC_206.id) {
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
    return new Promise((resolve) => {
      const zacWire = new Zacwire();

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
          return;
        }

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
      });
    });
  }

  private calculateTemperatureFromZacwire(result: number): number {
    // Zacwire result is between 0 (minTemperature) and 2048 (maxTemperature)

    const temperatureRange =
      this.sensor.maxTemperature - this.sensor.minTemperature;
    return (result / 2048) * temperatureRange + this.sensor.minTemperature;
  }
}

let mockedGpio: any;
jest.mock('pigpio', () => {
  mockedGpio = { constructor: jest.fn(), on: jest.fn() };
  return { Gpio: jest.fn(() => mockedGpio) };
});

jest.mock('../src/lib/zacwire', () => {
  const mockedZacwire = {
    getResult: jest.fn(() => Number('0x2ff')),
    hasHighTick: jest.fn(() => true),
    highTickDiff: jest.fn(() => 2000),
    setLastLowTick: jest.fn(),
    setLastHighTick: jest.fn(),
    startOfFirstPacket: jest.fn(),
  };
  return { Zacwire: jest.fn(() => mockedZacwire) };
});

import { Gpio } from 'pigpio';
import { Tsic } from '../src/tsic';

describe('Tsic', () => {
  test('constructor', () => {
    Gpio.INPUT = 9;
    const tsic = new Tsic(12);
    expect(Gpio).toHaveBeenCalledWith(12, {
      mode: 9,
      alert: true,
    });
    expect(tsic.getDataPin()).toBe(mockedGpio);
    expect(tsic['sensor']).toBe(Tsic.TSIC_206);
  });

  test('constructor with unsupported sensor', () => {
    expect(() => {
      new Tsic(12, 123);
    }).toThrow('This library does currently only support TSIC 206');
  });

  test('calculate temperature from Zacwire data', () => {
    const tsic = new Tsic(12);

    const promise = tsic.getTemperature();

    const callback = mockedGpio.on.mock.calls[0][1];
    callback(0, 1000);

    return promise.then((temperature: number) => {
      // according to the datasheet, the temperature should be 25°C for 0x2ff
      expect(Math.round(temperature)).toBe(25);
    });
  });
});

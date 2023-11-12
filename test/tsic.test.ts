let mockedGpio: {
  constructor: jest.Mock;
  on: jest.Mock;
  once: jest.Mock;
  removeListener: jest.Mock;
  disableAlert: jest.Mock;
};
jest.mock('pigpio', () => {
  mockedGpio = {
    constructor: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(() => mockedGpio),
    disableAlert: jest.fn(),
  };
  return { Gpio: jest.fn(() => mockedGpio) };
});

const mockedZacwire = {
  getResult: jest.fn(() => Number('0x2ff')),
  hasHighTick: jest.fn(() => true),
  highTickDiff: jest.fn(() => 2000),
  setLastLowTick: jest.fn(),
  setLastHighTick: jest.fn(),
  startOfFirstPacket: jest.fn(),
};

jest.mock('../src/lib/zacwire', () => {
  return { Zacwire: jest.fn(() => mockedZacwire) };
});

import { Gpio } from 'pigpio';
import { Tsic } from '../src/tsic';

describe('Tsic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    expect(mockedGpio.removeListener).toHaveBeenCalled();
    expect(mockedGpio.disableAlert).toHaveBeenCalled();

    return promise.then((temperature: number) => {
      // according to the datasheet, the temperature should be 25°C for 0x2ff
      expect(Math.round(temperature)).toBe(25);
    });
  });

  test('sanity check Zacwire data', async () => {
    mockedZacwire.getResult.mockReturnValueOnce(3000);

    const tsic = new Tsic(13);
    const promise = tsic.getTemperature();

    const callback = mockedGpio.on.mock.calls[0][1];
    callback(0, 1000);

    await expect(promise).rejects.toMatch('range');
  });
});

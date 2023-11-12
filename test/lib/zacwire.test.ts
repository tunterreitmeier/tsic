jest.mock('pigpio', () => ({
  tickDiff: jest.fn().mockImplementation((a: number, b: number) => b - a),
}));
import { tickDiff } from 'pigpio';
import { Zacwire } from '../../src/lib/zacwire';

describe('Zacwire', () => {
  let zacwire: Zacwire;

  const appendBitsFromBuffer = (zacWire: Zacwire, buffer: string) => {
    for (let i = 0; i < buffer.length; i++) {
      const bit = buffer[i];
      if (bit !== '0' && bit !== '1') {
        throw new Error(
          'bit buffer must only contain 0 or 1 - received ' + bit,
        );
      }
      zacWire.appendBitToBuffer(bit === '1' ? 1 : 0);
    }
  };

  beforeEach(() => {
    zacwire = new Zacwire();
  });

  test('setLastLowTick and hasLowTick', () => {
    expect(zacwire.hasLowTick()).toBe(false);
    zacwire.setLastLowTick(10);
    expect(zacwire.hasLowTick()).toBe(true);
  });

  test('setLastHighTick and hasHighTick', () => {
    expect(zacwire.hasHighTick()).toBe(false);
    zacwire.setLastHighTick(10);
    expect(zacwire.hasHighTick()).toBe(true);
  });

  test('setStrobeTime, hasStrobeTime and getStrobeTime', () => {
    expect(zacwire.hasStrobeTime()).toBe(false);
    zacwire.setStrobeTime(10);
    expect(zacwire.hasStrobeTime()).toBe(true);
    expect(zacwire.getStrobeTime()).toBe(10);
  });

  test('appendBitToBuffer', () => {
    appendBitsFromBuffer(zacwire, '101');
    expect(zacwire['receivedBits'].length).toBe(3);
  });

  test('startOfFirstPacket and startOfSecondPacket', () => {
    zacwire.startOfFirstPacket();
    appendBitsFromBuffer(zacwire, '101010100');
    zacwire.startOfSecondPacket();
    expect(zacwire['firstPacket']).toBe(170);
    expect(zacwire['secondPacket']).toBe(null);

    appendBitsFromBuffer(zacwire, '100010011');
    zacwire.startOfFirstPacket();
    expect(zacwire['firstPacket']).toBe(170);
    expect(zacwire['secondPacket']).toBe(137);
  });

  test('getResult', () => {
    expect(zacwire.getResult()).toBe(null);
    // 2 << 8 = 512
    zacwire.startOfFirstPacket();
    appendBitsFromBuffer(zacwire, '000000101');
    // 18
    zacwire.startOfSecondPacket();
    appendBitsFromBuffer(zacwire, '000100100');

    zacwire.startOfFirstPacket();
    expect(zacwire.getResult()).toBe(512 + 18);
  });

  test('reset on failed parity check', () => {
    zacwire.startOfFirstPacket();
    zacwire.setStrobeTime(25);
    zacwire.setLastHighTick(100);
    zacwire.setLastLowTick(200);
    appendBitsFromBuffer(zacwire, '000100011');
    zacwire.startOfSecondPacket();

    // ticks should not be reset
    expect(zacwire.hasLowTick()).toBe(true);
    expect(zacwire.hasHighTick()).toBe(true);
    expect(zacwire.hasStrobeTime()).toBe(false);
    expect(zacwire['receivedBits'].length).toBe(0);
    expect(zacwire['firstPacket']).toBe(null);
    expect(zacwire['secondPacket']).toBe(null);
  });

  test('tickdiff', () => {
    zacwire.setLastHighTick(100);
    zacwire.setLastLowTick(200);
    expect(zacwire.highTickDiff(200)).toBe(100);
    expect(zacwire.lowTickDiff(400)).toBe(200);
    expect(tickDiff).toHaveBeenCalledTimes(2);
  });
});

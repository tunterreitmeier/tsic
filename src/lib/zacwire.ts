import { tickDiff } from 'pigpio';

export class Zacwire {
  private lastLowTick: number | null = null;
  private lastHighTick: number | null = null;
  private strobeTime: number | null = null;
  private receivedBits: number[] = [];
  private firstPacket: number | null = null;
  private secondPacket: number | null = null;

  constructor() {}

  public setLastLowTick(value: number) {
    this.lastLowTick = value;
  }

  public hasLowTick(): boolean {
    return this.lastLowTick !== null;
  }

  public setLastHighTick(value: number) {
    this.lastHighTick = value;
  }

  public hasHighTick(): boolean {
    return this.lastHighTick !== null;
  }

  public lowTickDiff(tick: number): number {
    if (this.lastLowTick === null) {
      throw new Error('did not receive a low tick yet');
    }
    return tickDiff(this.lastLowTick, tick);
  }

  public highTickDiff(tick: number): number {
    if (this.lastHighTick === null) {
      throw new Error('did not receive a high tick yet');
    }
    return tickDiff(this.lastHighTick, tick);
  }

  public setStrobeTime(value: number) {
    this.strobeTime = value;
  }

  public hasStrobeTime(): boolean {
    return this.strobeTime !== null;
  }

  public getStrobeTime(): number {
    if (this.strobeTime === null) {
      throw new Error('did not receive a strobe time (calibration bit) yet');
    }
    return this.strobeTime;
  }

  public appendBitToBuffer(bit: 0 | 1): void {
    this.receivedBits.push(bit);
  }

  public startOfFirstPacket(): void {
    if (!this.checkParity()) {
      return this.reset();
    }

    this.secondPacket = this.bufferToInt();
    this.receivedBits = [];
    this.strobeTime = null;
  }

  public startOfSecondPacket(): void {
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

  public getResult(): number | null {
    if (this.firstPacket === null || this.secondPacket === null) {
      return null;
    }
    return (this.firstPacket << 8) + this.secondPacket;
  }

  // checks whether the count of 1 bits is even
  private checkParity(): boolean {
    if (this.receivedBits.length !== 9) {
      return false;
    }
    const parityBit = this.receivedBits.pop();
    return (
      this.receivedBits.reduce((acc, val) => acc + val, 0) % 2 === parityBit
    );
  }

  private reset(): void {
    this.strobeTime = null;
    this.receivedBits = [];
    this.firstPacket = null;
    this.secondPacket = null;
  }

  private bufferToInt(): number {
    return parseInt(this.receivedBits.join(''), 2);
  }
}

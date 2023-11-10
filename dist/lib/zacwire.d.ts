export declare class Zacwire {
    private lastLowTick;
    private lastHighTick;
    private strobeTime;
    private receivedBits;
    private firstPacket;
    private secondPacket;
    constructor();
    setLastLowTick(value: number): void;
    hasLowTick(): boolean;
    setLastHighTick(value: number): void;
    hasHighTick(): boolean;
    lowTickDiff(tick: number): number;
    highTickDiff(tick: number): number;
    setStrobeTime(value: number): void;
    hasStrobeTime(): boolean;
    getStrobeTime(): number;
    appendBitToBuffer(bit: 0 | 1): void;
    startOfFirstPacket(): void;
    startOfSecondPacket(): void;
    getResult(): number | null;
    private checkParity;
    private reset;
    private bufferToInt;
}

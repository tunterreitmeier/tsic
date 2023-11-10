import { Gpio } from 'pigpio';
interface Sensor {
    id: number;
    maxTemperature: number;
    minTemperature: number;
}
export declare class Tsic {
    static readonly TSIC_206: Sensor;
    static readonly SENSORS: number[];
    private dataPin;
    private sensor;
    constructor(dataPin: number, sensorId?: number);
    getDataPin(): Gpio;
    getTemperature(): Promise<unknown>;
    private calculateTemperatureFromZacwire;
}
export {};

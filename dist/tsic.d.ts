import { Gpio } from 'pigpio';
type SensorId = number;
type Sensor = {
    id: SensorId;
    maxTemperature: number;
    minTemperature: number;
};
export declare class Tsic {
    static readonly TSIC_206: Sensor;
    static readonly SENSORS: number[];
    private dataPin;
    private dataPinNumber;
    private sensor;
    constructor(dataPin: number, sensorId?: SensorId);
    getDataPin(): Gpio;
    getTemperature(): Promise<number>;
    private calculateTemperatureFromZacwire;
    private resultSanityCheck;
    private enableTimeout;
}
export {};

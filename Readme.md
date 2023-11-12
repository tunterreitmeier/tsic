# TSIC Digital Sensor library

This library aims at enabling to easily read the temperature of TSIC sensors via the Zacwire protocol.

> ⚠️ Currently, this library is only able to read TSIC 206 sensors. As this is the only sensor I have at home, I'm not able to test and verify other sensors. Please feel free to contact me or open a PR for other sensors. From reading their datasheets, it should be a fairly simple process to enable them.

## Usage

First, require the package as a dependency

```shell
npm install tsic-sensor
```

Smaple usage:

```javascript
import { Tsic } from 'tsic-sensor';

// The GPIO pin number to which the sensor (data pin) is connected
const gpioPin = x;
const tsic = new Tsic(gpioPin);

tsic
  .getTemperature()
  .then((temperature) => console.log('Temperature: %d C', temperature))
  .catch(console.error);
```

### pigpio and why privileged?

This library is based on [pigpio](https://github.com/fivdi/pigpio). Please check out their documentation, if you are getting errors related to this.\
See: https://github.com/fivdi/pigpio#readme

Also, pigpio requires scripts to be run with sudo/root privileges to access hardware.\
See: https://github.com/fivdi/pigpio#limitations

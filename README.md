Solution for NASA's [Track the Space Station in 3D](https://2022.spaceappschallenge.org/challenges/2022-challenges/track-the-iss/details) challenge. [**Demo**](https://inad9300.github.io/3d-iss-tracker).

### Getting started

```sh
npm install
npm start
```


### To-do

- [ ] Render ISS in current position
- [ ] Render ISS predicted orbit
- [ ] Correct sun position (currently based on UTC time alone)
- [ ] Correct ISS position (currently assuming Earth is a perfect sphere)
- [ ] Add starry background

---

- [ ] Connection availability (based on reachable ground stations)
- [ ] ISS position across time
- [ ] Overhead pass prediction (given a location)
- [ ] Space debris alerts
- [ ] Solar panel orientation

---

- [ ] Add open source, permissive license
- [ ] Add credit to all resources used
- [ ] Publish as web application (GitHub pages?)
- [ ] Formally register to challenge and submit project


### Credits

#### JavaScript libraries

- [three.js](https://github.com/mrdoob/three.js) by Ricardo Cabello et al., used as an abstraction layer over WebGL
- [tle.js](https://github.com/davidcalhoun/tle.js) by David Calhoun, used for predicting the ISS' orbit

#### HTTP APIs

- [TLE API](https://tle.ivanstanojevic.me) by NASA, used to obtain up-to-date two-line element sets of the ISS

#### Assets

- [ISS 3D model](https://solarsystem.nasa.gov/resources/2378/international-space-station-3d-model) by NASA
- [Earth 3D model](https://solarsystem.nasa.gov/resources/2393/earth-3d-model) by NASA
- [Sun 3D model](https://solarsystem.nasa.gov/resources/2352/sun-3d-model) by NASA
- [Milky Way panorama](https://www.eso.org/public/images/eso0932a) by European Southern Observatory (ESO)

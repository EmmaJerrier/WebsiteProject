

geohash
=======
<p>
<a href="https://twitter.com/stefanodecillis" rel="nofollow"><img src="https://img.shields.io/badge/created%20by-@stefanodecillis-4BBAAB.svg" alt="Created by Stefano De Cillis"></a>
<a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/stefanodecillis/node-geohash" alt="License"></a>
<a href="https://www.npmjs.com/package/node-geohash" rel="nofollow"><img src="https://img.shields.io/npm/dw/node-geohash.svg" alt="npm"></a>
<a href="https://github.com/stefanodecillis/node-geohash" rel="nofollow"><img src="https://img.shields.io/github/stars/stefanodecillis/node-geohash" alt="stars"></a>
</p>

> This package is based on [latlon-geohash](https://github.com/chrisveness/latlon-geohash) by [Chris Veness](https://github.com/chrisveness) 
> adapted and refactored for TypeScript applications. Original code is under MIT License.


Functions to convert a [geohash](http://en.wikipedia.org/wiki/Geohash) to/from a latitude/longitude
point, and to determine bounds of a geohash cell and find neighbours of a geohash.

API
---

- `Geohash.encode(lat, lon, [precision])`: encode latitude/longitude point to geohash of given precision
   (number of characters in resulting geohash); if precision is not specified, it is inferred from
   precision of latitude/longitude values.
- `Geohash.decode(geohash)`: return { lat, lon } of centre of given geohash, to appropriate precision.
- `Geohash.bounds(geohash)`: return { sw, ne } bounds of given geohash.
- `Geohash.adjacent(geohash, direction)`: return adjacent cell to given geohash in specified direction (N/S/E/W).
- `Geohash.neighbours(geohash)`: return all 8 adjacent cells (n/ne/e/se/s/sw/w/nw) to given geohash.

Note to obtain neighbours as an array, you can use

    const neighboursObj = Geohash.neighbours(geohash);
    const neighboursArr = Object.keys(neighboursObj).map(n => neighboursObj[n]);

The parent of a geocode is simply `geocode.slice(0, -1)`.

If you want the geohash converted from Base32 to Base4, you can e.g.:

    parseInt(Geohash.encode(52.20, 0.12, 6), 32).toString(4);


Usage
----------------

Geohash can be used in a Node.js app from [npm](https://www.npmjs.com/package/node-geohash):

```shell
$ npm install node-geohash 
> import Geohash from 'node-geohash';
> const geohash = Geohash.encode(52.20, 0.12, 6);
> console.assert(geohash == 'u120fw');
> const latlon = Geohash.decode('u120fw');
> console.assert(JSON.stringify(latlon) == '{"lat":52.1988,"lon":0.115}');
```

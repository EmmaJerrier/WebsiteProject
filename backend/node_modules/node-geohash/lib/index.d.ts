/**
 * Geohash: Gustavo Niemeyer’s geocoding system.
 */
export default class Geohash {
    /**
     * Encodes latitude/longitude to geohash, either to specified precision or to automatically
     * evaluated precision.
     *
     * @param   {number} lat - Latitude in degrees.
     * @param   {number} lon - Longitude in degrees.
     * @param   {number} [precision] - Number of characters in resulting geohash.
     * @returns {string} Geohash of supplied latitude/longitude.
     * @throws  Invalid geohash.
     *
     * @example
     *     const geohash = Geohash.encode(52.205, 0.119, 7); // => 'u120fxw'
     */
    static encode(lat: number, lon: number, precision?: number): string;
    /**
     * Decode geohash to latitude/longitude (location is approximate centre of geohash cell,
     *     to reasonable precision).
     *
     * @param   {string} geohash - Geohash string to be converted to latitude/longitude.
     * @returns {{lat:number, lon:number}} (Center of) geohashed location.
     * @throws  Invalid geohash.
     *
     * @example
     *     const latlon = Geohash.decode('u120fxw'); // => { lat: 52.205, lon: 0.1188 }
     */
    static decode(geohash: string): {
        lat: number;
        lon: number;
    };
    /**
     * Returns SW/NE latitude/longitude bounds of specified geohash.
     *
     * @param   {string} geohash - Cell that bounds are required of.
     * @returns {{sw: {lat: number, lon: number}, ne: {lat: number, lon: number}}}
     * @throws  Invalid geohash.
     */
    static bounds(geohash: string): {
        sw: {
            lat: number;
            lon: number;
        };
        ne: {
            lat: number;
            lon: number;
        };
    };
    /**
     * Determines adjacent cell in given direction.
     *
     * @param   {string} geohash - Cell to which adjacent cell is required.
     * @param   {string} direction - Direction from geohash (N/S/E/W).
     * @returns {string} Geocode of adjacent cell.
     * @throws  Invalid geohash.
     */
    static adjacent(geohash: string, direction: "n" | "s" | "e" | "w"): string;
    /**
     * Returns all 8 adjacent cells to specified geohash.
     *
     * @param   {string} geohash - Geohash neighbours are required of.
     * @returns {{n,ne,e,se,s,sw,w,nw: string}}
     * @throws  Invalid geohash.
     */
    static neighbours(geohash: string): {
        n: string;
        ne: string;
        e: string;
        se: string;
        s: string;
        sw: string;
        w: string;
        nw: string;
    };
}

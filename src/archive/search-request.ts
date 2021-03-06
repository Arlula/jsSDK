
/**
 * @class SearchRequest constructs a request to search for archival imagery
 * 
 * Searches must specify a target in both space and time;
 *  - Either a target date, or a target date range must be set.
 *  - Similarly a target point or bounding box must be set.
 * 
 * The current validity of the request may be tested with the "valid" method.
 */
export default class SearchRequest {
    private _start: Date;
    private _end?: Date;
    private _res: number = Resolution.veryLow;
    private _point?: {long:number,lat:number};
    private _box?: {west: number, north: number, east: number, south: number};
    /**
     * Construct a new search request
     * @param {Date} [date] the target date to search
     */
    constructor(date?: Date) {
        this._start = date||new Date();
    }

    /**
     * Search at a target date (removes any previously set end date)
     * @param {Date} date The date to search at
     * @returns {SearchRequest} The current request for chaining
     */
    atDate(date: Date): SearchRequest {
        this._end = undefined;
        this._start = date;
        return this;
    }

    /**
     * set the starting search date if its changed since the constructor
     * @param {Date} date Target date, or start date for a date range
     * @returns {SearchRequest} The current request for chaining
     */
    from(date: Date): SearchRequest {
        this._start = date;
        return this;
    }

    /**
     * Set the end date for a date range search
     * @param {Date} date end date of date range
     * @returns {SearchRequest} The current request for chaining
     */
    to(date: Date): SearchRequest {
        this._end = date;
        return this;
    }

    /**
     * Explicitly sets the date range to search
     * @param {Date} start start date to begin imagery search
     * @param {Date} end end date to stop imagery search
     * @returns {SearchRequest} The current request for chaining
     */
    betweenDates(start: Date, end: Date): SearchRequest {
        this._start = start;
        this._end = end;
        return this;
    }

    /**
     * search around a target point
     * @param {number} long the longitude of the point
     * @param {number} lat the latitude of the point
     * @returns {SearchRequest} The current request for chaining
     */
    point(long: number, lat: number): SearchRequest {
        this._box = undefined;
        this._point = {long, lat};
        return this;
    }

    /**
     * search within a bounding box
     * @param {number} west   the western boundary of the box
     * @param {number} north  the northern boundary of the box
     * @param {number} east   the eastern boundary of the box
     * @param {number} south  the southern boundary of the box
     * @returns {SearchRequest} The current request for chaining 
     */
    boundingBox(west: number, north: number, east: number, south: number): SearchRequest {
        this._point = undefined;
        this._box = {west, north, east, south};
        return this;
    }

    /**
     * Set the maximum resolution that will be returned by a search
     * Search either by a specified resolution in m/pixel or using one of
     * the predefined Resolution labels
     * 
     * NOTE: a minimum search of 0.1m/pixel is accepted, lower resolutions are less likely to return as many, or any results
     * 
     * @param {number|Resolution} res the resolution to limit the result set to
     * @returns {SearchRequest} The current request for chaining
     */
    setMaximumResolution(res: number|Resolution): SearchRequest {
        this._res = res;
        return this;
    }

    /**
     * Check whether the request meets the minimum requirements to be valid
     * @returns {boolean} whether the request is currently valid
     */
    valid(): boolean {
        return !!(this._start && this._res > 0.1 && (this._point || this._box));
    }

    /**
     * convert the request into a query string map in preparation for sending
     * 
     * Note: this is for internal use and is not intended for use by end users
     * 
     * @returns {Query Map}
     */
    _toQuery(): {[key: string]: string} {
        const query: {[key: string]: string} = {
            start: `${this._start.getFullYear()}-${pad(this._start.getMonth()+1, 2)}-${pad(this._start.getDate(), 2)}`,
            res: this._res.toString(),
        };

        if (this._end) {
            query.end = `${this._end.getFullYear()}-${pad(this._end.getMonth()+1, 2)}-${pad(this._end.getDate(), 2)}`;
        }

        if (this._point) {
            query.lat = this._point.lat.toString();
            query.long = this._point.long.toString();
        }

        if (this._box) {
            query.west = this._box.west.toString();
            query.north = this._box.north.toString();
            query.east = this._box.east.toString();
            query.south = this._box.south.toString();
        }

        return query;
    }
}

/**
 * Resolution labels for commonly desired imagery precisions
 * 
 * veryHigh -> 0.5m/pixel or less
 * high -----> 1m/pixel or less
 * medium ---> 5m/pixel or less
 * low ------> 20m/pixel or less
 * veryLow --> 10km/pixel or less (arbitrary large value to return all sources)
 */
export enum Resolution {
    veryHigh = 0.5,
    high = 1,
    medium = 5,
    low = 20,
    veryLow = 100000,
}

function pad(num: number, size: number): string {
    let numStr = num.toString();
    while (numStr.length < size) numStr = "0" + num;
    return numStr;
}

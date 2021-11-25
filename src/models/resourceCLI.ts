import ResourceCommon from './resourceCommon';

/**
 * @extends { ResourceCommon }
 */
export default class ResourceCLI extends ResourceCommon {
    /**
     * @constructor
     * @param url { string }
     */
    constructor(
        url: string,
    ) {
        super(url)
        this.consecutiveErrorLimit = Number(process.env['CONSECUTIVE_ERROR_LIMIT']) || 0
        this.verboseMode = process.env['VERBOSE_MODE']?.toLowerCase() === 'true'
        this.endlessMode = process.env['ENDLESS_MODE']?.toLowerCase() === 'true'
        this.maxNumberOfRepeats = Number(process.env['REPEAT_TIMES']?.toLowerCase()) || 0
        this.pollFrequency = Number(process.env['POLL_FREQUENCY']) || 0
        this.waitUntil = process.env['WAIT_UNTIL'] || 'networkidle0'
    }
}

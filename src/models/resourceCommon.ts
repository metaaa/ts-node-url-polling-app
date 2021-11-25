export default class ResourceCommon {
    /**
     * Url to be polled
     */
    public url: string
    /**
     * Count of the polls
     */
    public pollCounter: number
    /**
     * Count of failed polls (because server error, timeout, etc)
     */
    public errorCounter: number
    /**
    * Count of consecutive errors
    */
    public errorsInARow: number
    /**
     * Maximum count of consecutive errors before the polling is shut down for the given url
     */
    protected consecutiveErrorLimit!: number
    /**
     * Is the limit for consecutive error reached
     */
    protected consecutiveErrorLimitReached: boolean
    /**
     * Is the polling for the provided url running in verbose mode
     */
    protected verboseMode!: boolean
    /**
     * Is the polling for the provided url running in endless mode
     */
    protected endlessMode!: boolean
    /**
     * Maximum nuber of repeats
     */
    protected maxNumberOfRepeats!: number
    /**
     * Maximum number of polls before the polling is terminated
     */
    protected maxPollCountReached: boolean
    /**
     * Polling frequency in minutes
     */
    protected pollFrequency!: number
    /**
     * Network status to wait until the loading considered successful [networkidle0|networkidle2]
     */
    protected waitUntil!: string

    /**
     * @constructor
     * @param url { string }
     */
    constructor(url: string) {
        if (new.target === ResourceCommon) {
            throw Error("Cannot instantiate abstract class!")
        }

        this.url = url
        this.pollCounter = 1
        this.errorCounter = 0
        this.errorsInARow = 0
        this.consecutiveErrorLimitReached = false
        this.maxPollCountReached = false
    }

    /**
     * Returns whether the error limit is reached
     *
     * @returns { boolean }
     */
    public hasErrorLimitReached(): boolean {
        return this.consecutiveErrorLimitReached
    }

    /**
     * Returns whether the polling is done
     *
     * @returns { boolean }
     */
    public isMaxPollCountReached(): boolean {
        return this.maxPollCountReached
    }

    /**
     * Resets the consecutive error counter
     */
    public resetErrorsInARowCounter(): void {
        this.errorsInARow = 0
    }

    /**
     * Increases the poll counter
     * Side effect: Sets the polling done if the polling limit was reached
     */
    public increasePollCount(): void {
        if (!this.endlessMode && this.pollCounter >= this.maxNumberOfRepeats) {
            this.maxPollCountReached = true
        }

        this.pollCounter++
    }

    /**
     * Increases the error count
     * Side effect: Sets the consecutive error reached if the error limit was reached
     */
    public increaseErrorCount(): void {
        this.errorCounter++
        
        if (this.consecutiveErrorLimit > 0) {
            this.errorsInARow++
            this.consecutiveErrorLimitReached = this.errorsInARow >= this.consecutiveErrorLimit
        }
    }

    /**
     * Returns the polling frequency in minutes
     *
     * @returns { number }
     */
    public getInterval(): number {
        return this.pollFrequency * 60000
    }

    /**
     * Returns whether the resource has any frequency (in mins) set
     * @returns { boolean }
     */
    public hasPollingFrequencySet(): boolean {
        return this.pollFrequency > 0
    }
}

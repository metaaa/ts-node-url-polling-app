import { PuppeteerLifeCycleEvent } from 'puppeteer'

export const validLifeCycleEvents: Array<PuppeteerLifeCycleEvent> = [
    'load',
    'domcontentloaded',
    'networkidle0',
    'networkidle2',
]

export default abstract class ResourceCommon {
    /**
     * URL to be polled
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
    protected waitUntil!: PuppeteerLifeCycleEvent

    /**
     * @constructor
     */
    constructor(url: string) {
        if (new.target === ResourceCommon) {
            throw Error("Cannot instantiate abstract class!")
        }

        this.pollCounter = 0
        this.errorCounter = 0
        this.errorsInARow = 0
        this.consecutiveErrorLimitReached = false
        this.maxPollCountReached = false
        this.url = url
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
        this.pollCounter++

        if (!this.endlessMode && this.pollCounter >= this.maxNumberOfRepeats) {
            this.maxPollCountReached = true
        }
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
    public getInterval(lastExecutionTime: number): number {
        return (this.pollFrequency * 60000) - lastExecutionTime
    }

    /**
     * Returns whether the resource has any frequency (in mins) set
     *
     * @returns { boolean }
     */
    public hasPollingFrequencySet(): boolean {
        return this.pollFrequency > 0
    }

    /**
     * Returns the HTTP network status, that specifies when should a polling attempt be considered as successful
     *
     * @returns { PuppeteerLifeCycleEvent }
     */
    public getWaitUntil(): PuppeteerLifeCycleEvent {
        return this.waitUntil
    }
}

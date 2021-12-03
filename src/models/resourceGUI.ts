import ResourceCommon, { validLifeCycleEvents } from './resourceCommon'
import { PuppeteerLifeCycleEvent } from 'puppeteer'

/**
 * @extends { ResourceCommon }
 */
export default class ResourceGUI extends ResourceCommon {
    /**
     * Is the polling active (or draft)
     */
    private isActive: boolean
    
    /**
     * @constructor
     * @param url { string }
     */
    constructor(
        url: string,
    ) {
        super(url)
        this.isActive = false
        this.consecutiveErrorLimit = 5
        this.verboseMode = false
        this.endlessMode = true
        this.maxNumberOfRepeats = 0
        this.pollFrequency = 1
        this.waitUntil = 'networkidle0'
    }

    /**
     * Returns whether the polling is active
     *
     * @returns { boolean }
     */
    public isPollingActive(): boolean {
        return this.isActive
    }

    /**
     * Sets the polling active or inactive
     *
     * @param newStatus { boolean }
     */
    public setIsPollingActive(newStatus: boolean): void {
        this.isActive = newStatus
    }

    /**
     * Sets the network status when a polling considered as successful
     *
     * @param param { PuppeteerLifeCycleEvent }
     */
    public setWaitUntil(param: PuppeteerLifeCycleEvent) {
        if (!validLifeCycleEvents.includes(param)) {
            throw Error(`Invalid network status type: ${param}`)
        }
        this.waitUntil = param
    }
}

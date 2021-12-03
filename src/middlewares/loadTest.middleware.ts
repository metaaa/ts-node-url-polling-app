import { Summary, Counter } from 'prom-client'
import { HTTPResponse, Page } from 'puppeteer';
import ResourceGUI from '../models/resourceGUI';
import App from '../app'
import { errorC, successC, warnC, resetC, bold } from '../helpers/terminalColors';
import ResourceCLI from '../models/resourceCLI';
import { Protocol } from 'devtools-protocol';

/**
 * Calls the load test for the given url with the given repetition
 *
 * @param { Summary } summary
 * @param { Counter } errorCounter
 * @param { Array } resource
 */
export async function loadTestUrl(summary: Summary<any>, errorCounter: Counter<any>,  resource: ResourceGUI|ResourceCLI, page: Page) {
    /**
     * The execution time of the process
     */
    let processExecutionTime!: number
    /**
     * The HTTP Response object
     */
    let response!: HTTPResponse
    /**
     * Stores the fact whether the polling was successful
     */
    let pollingSucceeded!: boolean
    
    // Wether the polling succeeds, it counts as a polling attempt
    resource.increasePollCount()
    // start measuring for summary and process execution time
    let end = summary.startTimer()
    let endTime: [number, number] = process.hrtime()

    try {
        response = await page.goto(resource.url, {
            waitUntil: resource.getWaitUntil(),
            timeout: resource.getInterval(0)
        })
        pollingSucceeded = true
    } catch (e) {
        resource.increaseErrorCount()
        console.log(`[${warnC + bold} WARN ${resetC}] - #${resource.pollCounter} ${resource.url} - (failed #${resource.errorCounter} time${resource.errorCounter === 1 ? '' : 's'})`)
        pollingSucceeded = false
        if (App.isVerboseMode()){
            console.error(e)
        }
    } finally {
        const processDuration: [number, number] = process.hrtime(endTime)
        processExecutionTime = processDuration[0] * 1000 + processDuration[1] / 1000000

        if (pollingSucceeded) {
            // if polling was successful, the app pushes new statistics to the summary
            end({
                route: resource.url,
                code: response.status(),
                method: response.request().method(),
            })

            resource.resetErrorsInARowCounter()
    
            console.log(`[${successC + bold} OK ${resetC}] - #${resource.pollCounter} ${resource.url} in ${Math.round(processExecutionTime)} ms`)
        } else {
            errorCounter.inc({type: 'invalid', route: resource.url}, 1)
        }
        // delete all cookies before reload
        const cookies: Array<Protocol.Network.Cookie> = await page.cookies()
        Promise.all(cookies.map(async (cookie: Protocol.Network.Cookie) => {
            await page.deleteCookie({ name: cookie.name })
        }))

        if (!resource.isMaxPollCountReached() && !resource.hasErrorLimitReached()) {
            if (!resource.hasPollingFrequencySet()) {
                process.nextTick(async () => await loadTestUrl(summary, errorCounter, resource, page))
            } else {
                setTimeout(() => {
                    process.nextTick(async () => await loadTestUrl(summary, errorCounter, resource, page))
                }, resource.getInterval(processExecutionTime))
            }
        } else {
            // The browser removes targets from the list before the associated pages are closed, hence we need a timeout.
            await page.waitForTimeout(3000)
            await page.close()

            if (resource.hasErrorLimitReached()) {
                console.warn(`[${errorC + bold} ERROR ${resetC}] Polling '${resource.url}' has been failed ${resource.errorsInARow} times in a row. Shutting down polling for this url...`)
            } else if (resource.isMaxPollCountReached()){
                console.log(`${bold}[${successC} DONE ${resetC}] Polling ${resource.url} has been finished!`)
            }
        }
    }
}

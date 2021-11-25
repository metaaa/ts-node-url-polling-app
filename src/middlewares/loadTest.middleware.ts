import { Summary, Counter } from 'prom-client'
import puppeteer from 'puppeteer';
import ResourceGUI from '../models/resourceGUI';
import App from '../app'
import { errorC, successC, warnC, resetC } from '../helpers/terminalColors';
import ResourceCLI from '../models/resourceCLI';

/**
 * Calls the load test for the given url with the given repetition
 *
 * @param { Summary } summary
 * @param { Counter } errorCounter
 * @param { Array } resource
 */
export async function loadTestUrl(summary: Summary<any>, errorCounter: Counter<any>,  resource: ResourceGUI|ResourceCLI) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--use-gl=egl'],
    });
    const page = await browser.newPage();
    
    /**
     * The browser is up, a new page has been opened, so we are ready to measure the page load speed.
     * 
     * Start a timer where the value in seconds will observed
     * In later iterations the value will be updated
     */
    let end = summary.startTimer()
    const endTime: [number, number] = process.hrtime()
    let processExecutionTime: number

    await page.goto(resource.url, { waitUntil: 'networkidle2'})
    .then( async (data: any) => {
        end({
            route: resource.url,
            code: data._status,
            method: data._method
        })

        resource.resetErrorsInARowCounter()

        console.log(`[${successC}OK${resetC}] - #${resource.pollCounter} ${resource.url}`)
    })
    .catch((err: any) => {
        errorCounter.inc({type: 'invalid', route: resource.url}, 1)

        resource.increaseErrorCount()
        console.log(`[${errorC}RES_ERR${resetC}] - #${resource.errorCounter} ${resource.url}`)

        if (App.isVerboseMode()){
            console.error(err)
        }
    })
    .finally(() => {
        resource.increasePollCount()

        const processDuration: [number, number] = process.hrtime(endTime)
        processExecutionTime = processDuration[0] * 1000 + processDuration[1] / 1000000
console.log(resource.getInterval(), processExecutionTime)
        if (!resource.isMaxPollCountReached() && !resource.hasErrorLimitReached()) {
            if (!resource.hasPollingFrequencySet()) {
                process.nextTick(async () => loadTestUrl(summary, errorCounter, resource))
            } else {
                setTimeout(() => {
                    process.nextTick(async () => await loadTestUrl(summary, errorCounter, resource))
                }, (resource.getInterval() - processExecutionTime))
            }
        } else if (resource.hasErrorLimitReached()) {
            console.warn(`[${warnC}WARN${resetC}] Polling '${resource.url}' has been failed ${resource.errorsInARow} times in a row. Shutting down polling for this url...`)
        } else if (resource.isMaxPollCountReached()){
            console.log(`[${successC}DONE${resetC}] Polling ${resource.url} has been finished!`)
        }
    })

    await browser.close();
}

import { Summary, Counter } from 'prom-client'
import autocannon from 'autocannon'

/**
 * Calls the load test for the given url with the given repetition
 *
 * @param { Summary } summary
 * @param errorCounter
 * @param { String } url
 * @param { number } repeat
 * @param { boolean } endlessMode
 */
export async function loadTestUrl(summary: Summary<any>, errorCounter: Counter<any>,  url: string, repeat: number, endlessMode: boolean) {
    /**
     * Counter for cli to show the current iteration
     */
    let counter = 1
    /**
     * Start a timer where the value in seconds will observed
     * In later iterations the value will be updated
     */
    let end = summary.startTimer()

    const instance = await autocannon({
        url: url,
        connections: 1,
        amount: repeat,
        forever: endlessMode
    }, (err: any, result: any) => {console.log('result')})

    /**
     * Handle the response got from the server.
     */
    instance.on('response', (client: any, statusCode: number, resBytes: any, responseTime: number) => {
        console.log(`${url}: ${counter++}`)
        // some servers give no response code, thus we want to handle these responses as invalid
        if (statusCode === undefined) {
            errorCounter.inc({type: 'invalid', route: url}, 1)
        } else {
            // We don't want to register responses with no statusCode
            end({
                route: url,
                code: statusCode, // code undefined esetén egy újabb stack jön létre grafanaban
                method: 'GET'
            })
        }
        end = summary.startTimer()
    })

    /**
     * Listen to request errors e.g. a timeout.
     */
    instance.on('reqError', (err) => {
        console.error(err)
        errorCounter.inc({type: 'failed', route: url}, 1)
    })
}

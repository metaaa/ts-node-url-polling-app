import { Summary } from 'prom-client'
import autocannon from 'autocannon'

/**
 * Calls the load test for the given url with the given repetition
 *
 * @param { Summary } summary
 * @param { String } url
 * @param { number } repeat
 */
export async function loadTestUrl(summary: Summary<any>, url: string, repeat: number) {
    /**
     * Counter for cli to show the current iteration
     */
    let counter = 1
    /**
     * Start a timer where the value in seconds will observed
     * In later iterations the value will be updated
     */
    let end = summary.startTimer()

    /**
     *
     */
    const instance = await autocannon({
        url: url,
        connections: 1,
        amount: repeat,
        // forever: true
    }, (err, result) => {console.log('vege')})

    /**
     *
     */
    instance.on('response', (client, statusCode, resBytes, responseTime) => {
    console.log(counter++)
        end({
            route: url,
            code: statusCode,
            method: 'GET'
        })
        end = summary.startTimer()
    })
}

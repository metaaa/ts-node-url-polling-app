import {Summary} from 'prom-client'
import { loadTest } from 'loadtest'

export function loadTestUrl(summary: Summary<any>, url: string) {
    const end = summary.startTimer()
    loadTest({
        url: url,
        maxRequests: 1,
        agentKeepAlive: true,
        maxSeconds: 99999999999999999,
        timeout: 5,
        statusCallback(error: any, result: { statusCode: any; method: any }, latency: any) {
            let statusCode = null
            let method = null
            if (typeof result !== 'undefined') {
                statusCode = result.statusCode
                method = result.method
            }
            end({
                route: url,
                code: statusCode,
                method: method
            })

            console.log(url + ' - requested [DONE]')
        }
    }, (error: any, result: any) => {
        if (error) {
            return console.error(error)
        }
    })
}
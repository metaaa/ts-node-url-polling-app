import { register, collectDefaultMetrics, Summary, Counter } from 'prom-client'
import { Page } from 'puppeteer'
import { loadTestUrl } from '../middlewares/loadTest.middleware'
import HeadlessBrowser from './headlessBrowser'
import ResourceCLI from './resourceCLI'

export default class CLIApp {
    private summary!: Summary<string>
    private errorCounter!: Counter<string>
    private urlList!: Array<string>

    initCLIRegistry () {
        this.urlList = (process.env['URL_LIST'] || '').split(',')

        /**
         * This metric registers the load times
         */
         this.summary = new Summary({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'code'],
            maxAgeSeconds: 600,
            ageBuckets: this.urlList.length,
        })

        /**
         * This metric registers the failed request/invalid responses counter
         */
         this.errorCounter = new Counter({
            name: 'http_request_invalid_responses',
            help: 'Counts invalid responses and timed out requests',
            labelNames: ['type', 'route'],
        })

        register.setDefaultLabels({
            app: 'nodejs-url-poller'
        })

        // There are some default metrics recommended by Prometheus itself.
        collectDefaultMetrics()

        register.registerMetric(this.summary)
        register.registerMetric(this.errorCounter)
    }

    /**
     * Starts the polling for the provided url list (defined in the env file)
     */
    public async startPolling(): Promise<void> {
        const browser = new HeadlessBrowser()
        await browser.initIncognitoBrowserContext()
        .then(async () => {
            Promise.all(this.urlList.map(async (url) => {
                const resourceParams = new ResourceCLI(url)
                browser.openNewPage()
                    .then(async (pageObject: Page) => {
                        await loadTestUrl(this.summary, this.errorCounter, resourceParams, pageObject)
                    })
            }))
        })
    }
}

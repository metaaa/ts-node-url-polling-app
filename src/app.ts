import * as bodyParser from 'body-parser'
import express, { Application } from 'express'
import { register } from 'prom-client'
import { createClient } from 'redis'
import CLIApp from './models/cliApp'

export default class App {
    public app: Application
    private port: number
    public redisClient: any

    constructor(
        port: number,
    ) {
        this.app = express()
        this.port = port

        this.initializeMiddlewares()
        this.initializeRoutes()
        this.initializeListeners()
        this.initializesErrorHandlers()
        this.initializePromClient()

        if (!App.isCLIMode()) {
            this.initializeRedisClient()
        }

        /**
         * If silent mode enabled all console.log() will be disabled
         */
        if (App.isCLIMode() && this.isSilentMode()) {
            console.log = function () {}
        }
    }

    /**
     * Is the app running in silent mode
     * 
     * @returns { boolean }
     */
    public isSilentMode(): boolean {
        return process.env['SILENT_MODE']?.toLowerCase() === 'true'
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`App listening on the port: ${this.port}`)
        })
    }

    /**
     * Returns whether the app runs in verbose mode
     *
     * @returns { boolean }
     */
    static isVerboseMode(): boolean {
        return process.env['VERBOSE_MODE']?.toLowerCase() === 'true'
    }

    /**
     * Returns whether the app runs in CLI mode
     *
     * @returns { boolean }
     */
    static isCLIMode(): boolean {
        return process.env['CLI_MODE']?.toLowerCase() === 'true'
    }

    /**
     * Register the summary type metrics for the prom-client
     *
     * @private
     */
    private async initializePromClient() {
        
        /**
         * If the app is controlled from the command line the polling should start automatically
         */
        if (App.isCLIMode()) {
            const cliModeApp: CLIApp = new CLIApp()
            cliModeApp.initCLIRegistry()
            await cliModeApp.startPolling()
        }
    }

    /**
     * Initializes middlewares
     */
    private async initializeMiddlewares() {
        try {
            this.app.use(bodyParser.json())
            this.app.use(bodyParser.urlencoded({ extended: true }))
            console.log(`Middlewares are ready!`)
        } catch (error) {
            console.error(`Couldn't set up middlewares: ${error}`)
        }
    }

    /**
     * Initializes routes
     */
    private async initializeRoutes() {
        try {
            this.app.route('/metrics')
                .get(async (request: express.Request, response: express.Response) => {
                    response.setHeader('Content-Type', register.contentType)
                    // diplays the metrics data for the cli mode (default) registry
                    response.end(await register.metrics())
                })
            console.log(`Routes were set up!`)
        } catch (error) {
            console.error(`Couldn't set up routes: ${error}`)
        }
    }

    /**
     * Initializes uncaught exception and unhandled rejection listeners
     */
    private async initializeListeners() {
        process.on('uncaughtException', error => {
            console.error('UNCAUGHT EXCEPTION! App will shut down...')
            console.error(error.name, error.message)
            process.exit(1)
          })

        process.on('unhandledRejection', (error, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason: ', error)
        })
    }

    /**
     * Initializes an error handler to catch all unhandled errors
     */
    private async initializesErrorHandlers() {
        this.app.use(
            function(error: any, request: express.Request, response: express.Response, next: express.NextFunction) {
                console.error(error.message)
                response.status(error.status || 500)
          })
    }

    /**
     * Initializes a connection to the redis server
     */
    private async initializeRedisClient() {
        const redisUsername: string = process.env['REDIS_USERNAME'] || ''
        const redisPassword: string = process.env['REDIS_PASSWORD'] || ''
        const redisHost: string = process.env['REDIS_HOST'] || 'localhost'
        const redisPort: number = Number(process.env['REDIS_PORT']) || 6379

        if (redisUsername !== '' && redisPassword !== '') {
            this.redisClient = createClient({
                url: `redis://${redisUsername}:${redisPassword}@${redisHost}:${redisPort}`
            })
        } else {
            this.redisClient = createClient()
        }
        this.redisClient.on('error', (err: any) => console.log('Redis Client Error', err))
        
        await this.redisClient.connect()

        console.log(`Connection to redis client has been established on port ${redisPort}!`)
    }
}

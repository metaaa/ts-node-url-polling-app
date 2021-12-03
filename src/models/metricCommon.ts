import { Metric, register } from 'prom-client'

export default abstract class MetricCommon {
    public name!: string
    public help!: string
    public labelNames!: Array<string>

    constructor({ name, help, labelNames }: BucketParams) {
        if (new.target === MetricCommon) {
            throw Error("Cannot instantiate abstract class!")
        }

        this.name = name
        this.help = help
        this.labelNames = labelNames
    }
}
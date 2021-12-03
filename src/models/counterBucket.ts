import { Counter } from "prom-client";
import MetricCommon from "./metricCommon";

export default class CounterBucket extends MetricCommon {
    public metricObject!: Counter<string>

    constructor({ name, help, labelNames }: BucketParams) {
        super ({ name, help, labelNames })

        this.metricObject = new Counter({
            name: this.name,
            help: this.help,
            labelNames: this.labelNames,
        })
    }
}
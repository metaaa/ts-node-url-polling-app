# URL polling app & Uptime checker

### Modules:
- Prometheus
- Graphana
- redis
- puppeteer

### Prerequisities:
- npm
- docker
- docker-compose

### Usage:
- clone git repo
- `cd` into directory
- run `npm install`
- run `docker-compose up`
  - running without `-d` is useful when using in CLI mode; the console logs every iteration (if not running in silenced mode)
- visit `localhost:3094/url-poller-dashboard` to see fancy graphs

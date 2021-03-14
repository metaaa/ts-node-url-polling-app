import App from './app';
import dotenv from 'dotenv';

dotenv.config();

const port: number = Number(process.env.PORT) || 8080;
const urlList: string = process.env.URL_LIST || ""
const repeat: number = Number(process.env.REPEAT_TIMES)
const endlessMode: boolean = eval(String(process.env.ENDLESS_MODE))
const cliMode: boolean = eval(String(process.env.CLI_MODE))
const silentMode: boolean = eval(String(process.env.SILENT_MODE))

/**
 * Create new App instance
 */
const app = new App(port, urlList, repeat, endlessMode, cliMode, silentMode);

app.listen();

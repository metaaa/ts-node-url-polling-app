import App from './app';
import dotenv from 'dotenv';

dotenv.config();

const port: number = Number(process.env.PORT) || 8080;
const urlList: string = process.env.URL_LIST || ""
const repeat: number = Number(process.env.REPEAT_TIMES)

/**
 * Create new App instance
 */
const app = new App(port, urlList, repeat);

app.listen();
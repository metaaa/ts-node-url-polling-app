import App from './app';
import dotenv from 'dotenv';

dotenv.config();

const port: number = Number(process.env.PORT) || 10147;
const urlList: string = process.env.URL_LIST || ""

/**
 * Create new App instance
 */
const app = new App(port, urlList);

app.listen();

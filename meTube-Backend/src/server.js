import http from 'http'
import { app } from './index.js';
import { connectDB } from './db/index.js';

const server = http.createServer(app);

console.log("ENV variables :", process.env);


server.listen(process.env.PORT, () => {
    connectDB();
})

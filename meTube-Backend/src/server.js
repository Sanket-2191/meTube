import http from 'http'
import { app } from './index.js';
import { connectDB } from './db/index.js';
import { Server } from 'socket.io';

const port = process.env.PORT || 8000;

const server = http.createServer(app); // needed for socket connection.... 

// console.log("ENV variables :", process.env);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    // needs client running with socket config i.e html page....
    console.log("Established connection✅");

})


app.listen(port, () => {
    console.log("app is running 🏃‍♀️ 🏃‍♀️");

    connectDB();
})

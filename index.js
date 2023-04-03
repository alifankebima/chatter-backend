require("dotenv").config();
const express = require("express");
const { Server } = require('socket.io');
const { createServer } = require('http');
const mainRouter = require("./src/router/index");
const cors = require("cors");
const commonHelper = require("./src/helper/common");
const helmet = require("helmet");
const morgan = require("morgan");
const xss = require("xss-clean");

const app = express();

// Implement Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000']
    }
})

// Implement API endpoints
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000']
}));
app.use(morgan("dev"));
app.use(helmet());
app.use(xss());
//app.use("/img", express.static("src/upload"));

const port = process.env.PORT || 443;

app.use("/api", mainRouter);
app.all("*", (req, res, next) => {
    next(commonHelper.response(res, null, 404, "URL not Found"));
});

// Realtime socket.io
const users = {};
io.on('connection', (socket) => {
    console.log(`ada perangkat yang terhubung dengan id ${socket.id}`);
    socket.on('messageAll', ({ message, user }) => {
        const current = new Date();
        let time = current.toLocaleTimeString();
        console.log(user + " : " + message)
        io.emit('messageBE', { user, message, date: time })
    })
    socket.on('messagePrivate', ({ message, id, user }) => {
        const current = new Date();
        let time = current.toLocaleTimeString();
        // socket.emit('messageBE', {user,message,date:time})
        socket.to(id).emit('messageBE', { user, message, date: time })
    })
    socket.on('inisialRoom', ({ room, username }) => {
        console.log(room);
        socket.join(room)
        // const current = new Date();
        // let time = current.toLocaleTimeString();
        // socket.broadcast.to(room).emit('notifAdmin', {
        //     sender:"Admin",
        //     message:`${username} selamat bergabung`,
        //     date:time
        // })
    })
    socket.on('sendMessage', ({ sender, message, room }) => {
        console.log(sender, message, room);
        const current = new Date();
        let time = current.toLocaleTimeString();
        io.to(room).emit('newMessage', { sender, message, date: time })
    })
    socket.on('disconnect', () => {
        console.log(`ada perangkat yang terputus dengan id ${socket.id}`);
    })
},
    []
);

app.use((err, req, res, next) => { // eslint-disable-line
    const messageError = err.message || "Internal server error";
    const statusCode = err.status || 500;

    //Fix multer file too large message to common helper response
    if (messageError == "File too large") {
        commonHelper.response(res, null, 413, "File too large (Max. 2MB)");
    } else {
        commonHelper.response(res, null, statusCode, messageError);
    }
})

httpServer.listen(port, () => {
    console.log(`Server internal port: ${port}`);
    console.log(`Server url: ${process.env.RAILWAY_STATIC_URL}`)
});
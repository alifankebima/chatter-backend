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

const privateMessageModel = require('./src/model/privateMessage')
const { v4: uuidv4 } = require('uuid');

// Implement Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [`${process.env.NODEMAILER_FRONTEND_URL}`]
    }
})

// Implement API endpoints
app.use(express.json());
app.use(cors({
    origin: [`${process.env.NODEMAILER_FRONTEND_URL}`]
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
const activeUsers = {}
const activeSocketId = {}
const updateActiveUsers = (activeUsers, user) => {
    activeUsers[user.username] = user;
    activeSocketId[user.id_socket] = user;
}

io.on('connection', (socket) => {
    console.log(`Device connected with id : ${socket.id}`);
    socket.on('setActiveUsers', ({ username }) => {
        updateActiveUsers(activeUsers, { id_socket: socket.id, username })
        console.log(activeUsers)
        io.emit('getActiveUsers', activeUsers)
    })
    socket.on('messageAll', ({ message, user }) => {
        const created_at = new Date(Date.now()).toISOString();
        console.log(user + " : " + message)
        io.emit('messageBE', { user, message, created_at })
    })

    socket.on('messagePrivate', ({ receiver_username, sender_username, message, sender_image, id_sender, id_receiver }) => {
        const created_at = new Date(Date.now()).toISOString();
        console.log({ receiver_username, sender_username, message, sender_image })

        const data = {};
            data.id = uuidv4();
            data.sender = id_sender;
            data.receiver = id_receiver;
            data.message = message;
            data.message_type= "text"
            data.created_at = created_at;
            data.updated_at = created_at;

            privateMessageModel.insertPrivateMessage(data).then(()=>{
                console.log("message added")
            }).catch((error) => console.log(error));

        if (activeUsers[receiver_username]) {
            const receiverId = activeUsers[receiver_username].id_socket;
            console.log("receiver id : "+ receiverId)

            socket.to(receiverId).emit('messageBE', { sender_username, receiver_username, message, created_at, sender_image })

            // privateMessageModel.selectReceiverPrivateMessageList(id_sender, "20", "0").then((result)=>{
            //     socket.to(receiverId).emit('updatePrivateMessageList', (result.rows))
            //     socket.emit('updatePrivateMessageList', (result.rows))
            // }).catch((error) => console.log(error));
        }
        socket.emit('messageBE', { sender_username, receiver_username, message, created_at, sender_image })
    })
    socket.on('sendMessage', ({ sender, message, room }) => {
        console.log(sender, message, room);
        const created_at = new Date(Date.now()).toISOString();
        io.to(room).emit('newMessage', { sender, message, created_at })
    })
    socket.on('disconnect', () => {
        console.log(`Device disconnected with socket id : ${socket.id}`);
        if (!activeSocketId[socket.id]) return;

        if (activeSocketId[socket.id].id_socket == socket.id) {
            console.log(`${activeSocketId[socket.id].username} has been deleted`)
            delete activeUsers[activeSocketId[socket.id].username]
            delete activeSocketId[socket.id]
        }
        console.log(activeUsers);
        io.emit('getActiveUsers', activeUsers)
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
    console.log(`Frontend URL : ${process.env.NODEMAILER_FRONTEND_URL}`)
});
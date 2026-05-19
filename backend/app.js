const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"], // allow frontend to connect
    methods: ["GET", "POST"]
  }
});

// Configure CORS for Express
const cors = require("cors");
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"] }));

// Import and initialize socket handler
const socketHandler = require("./sockets/socketHandler");
socketHandler(io);

//json to object
app.use(express.json());

const executeStudentCrudOperations = require("./config/db");
const userRoutes = require("./routes/userRoutes")
const roomRoutes = require("./routes/roomRoutes.js")
const messageRoutes = require("./routes/messageRoutes.js")
//middleware

app.use("/api", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
async function main() {
    await executeStudentCrudOperations();
    server.listen(3000, () => {
        console.log("server is listing at the port :3000");
    })
}
main();

const express = require("express");
const http = require("http");
const { ExpressPeerServer } = require("peer");
const socketIO = require("socket.io");
const socketFunctions = require("./sockets");

const app = express();
const server = http.createServer(app);

// SOCKET.IO SETUP
const io = socketIO(server, {
  cors: {
    origin: "*",
    transports: ["websocket"],
  },
});

// PEERJS SIGNALING SERVER SETUP
const peerServer = ExpressPeerServer(server, {
  path: "/peerjs",
  corsOptions: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Attach peerjs on /peerjs path
app.use("/peerjs", peerServer);

// SOCKET.IO EVENT HANDLERS
const users = {};
const socketToRoom = {};
const tokens = {};

io.on("connection", (socket) => {
  socketFunctions.requestJoinRoom(socket, io, users, tokens);
  socketFunctions.allowJoinRoom(socket, io, users, tokens, socketToRoom);
  socketFunctions.joinRoom(socket, io, users, socketToRoom);
  socketFunctions.readyRoom(socket);
  socketFunctions.disconnect(socket, io, users, socketToRoom, tokens);
  socketFunctions.sendMessage(socket, io, socketToRoom);
  socketFunctions.sendSignals(socket, io, socketToRoom);
});

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("Socket.IO + PeerJS signaling server is running 🚀");
});

// SERVER START
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

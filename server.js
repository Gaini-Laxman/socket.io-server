const express = require("express");
const http = require("http");
const { ExpressPeerServer } = require("peer");
const socketIO = require("socket.io");
const socketFunctions = require("./sockets"); // Your custom socket logic

const app = express();
const server = http.createServer(app);

// SOCKET.IO SETUP
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket"], // Enforcing websockets
  },
});

// PEERJS SIGNALING SERVER SETUP
const peerServer = ExpressPeerServer(server, {
  path: "/peerjs",
  corsOptions: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  proxied: true, // This helps behind proxies like Railway/Heroku
});

// MOUNT PEERJS SERVER AS MIDDLEWARE
app.use("/peerjs", peerServer);

// PEERJS EVENTS (optional but useful for debugging)
peerServer.on("connection", (client) => {
  console.log("✅ Peer connected: ", client.id);
});

peerServer.on("disconnect", (client) => {
  console.log("❌ Peer disconnected: ", client.id);
});

// SOCKET.IO EVENT HANDLERS (your custom logic)
const users = {};
const socketToRoom = {};
const tokens = {};

io.on("connection", (socket) => {
  console.log(`🔗 Socket connected: ${socket.id}`);
  socketFunctions.requestJoinRoom(socket, io, users, tokens);
  socketFunctions.allowJoinRoom(socket, io, users, tokens, socketToRoom);
  socketFunctions.joinRoom(socket, io, users, socketToRoom);
  socketFunctions.readyRoom(socket);
  socketFunctions.disconnect(socket, io, users, socketToRoom, tokens);
  socketFunctions.sendMessage(socket, io, socketToRoom);
  socketFunctions.sendSignals(socket, io, socketToRoom);
});

// HEALTH CHECK ROUTE
app.get("/", (req, res) => {
  res.send("🔥 Socket.IO + PeerJS signaling server is running 🚀");
});

// SERVER LISTEN
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is live on port ${PORT}`);
});

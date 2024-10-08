import express from "express";
import { Server, Socket } from "socket.io";
import http from "http";
import { UserManager } from "./managers/UserManager.js";
import cors from "cors";

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // Allow all origins
  },
  credentials: true, // Allow credentials (cookies, etc.)
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling']
});

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json("server connected");
});


io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins the lobby
  socket.on("join", () => {
    UserManager.addUser(socket);
    console.log("New user joined the lobby", socket.id);
    socket.emit("joined", socket.id);
  });

  // Create or join a room
  socket.on("roomCreate", ({roomId}) => {
    let socketIds;
    const room = io.sockets.adapter.rooms.get(roomId);
     if(room){
      socketIds = Array.from(room);
     }
    const data = UserManager.maintainQueue(socket.id,roomId,socketIds);
    if (data) {
      socket.join(data.roomId);
      socket.emit("roomCreated", data);
      io.to(data.user2).emit("joinRoom", { roomId: data.roomId, user1: data.user1 });
    } else {
      socket.emit("no-one", { message: "No one to call", value: 0 });
    }
  });

  // Handle joining a room
  socket.on("joinRoom", (data) => {
    socket.join(data.roomId);
    console.log(`User ${socket.id} joined room: ${data.roomId}`);
  });

  // Handle offer and answer
  socket.on("offer", (data) => {
    io.to(data.remoteSocketId).emit("incomingCall", { id: socket.id, offer: data.offer });
  });

  socket.on("accepted", (data) => {
    io.to(data.id).emit("accepted", { id: socket.id, ans: data.ans });
  });

  // Handle ICE candidate exchange
  socket.on("ice-candidate", (data) => {
    io.to(data.remoteSocketId).emit("ice-candidate", {
      candidate: data.candidate,
    });
  });

  // Handle negotiation
  socket.on("negotiation", (data) => {
    io.to(data.remoteSocketId).emit("negotiation", {
      id: socket.id,
      offer: data.offer,
    });
  });

  socket.on("negotiation-done", (data) => {
    io.to(data.id).emit("negotiation-final", {
      id: socket.id,
      ans: data.ans,
    });
  });

  socket.on("stopVideo",({remoteSocketId})=>{
    io.to(remoteSocketId).emit("stopVideo",{id:socket.id})
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    UserManager.removeUser(socket.id);
    console.log(`User ${socket.id} disconnected.`);
    socket.broadcast.emit('peerDisconnected', { id: socket.id });
  });
});

const PORT = process.env.PORT || 3100;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import express from "express";
import { Server, Socket } from "socket.io";
import http from "http";
import { UserManager } from "./managers/UserManager.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
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
  socket.on("roomCreate", () => {
    const data = UserManager.maintainQueue(socket.id);
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

  // Handle user disconnect
  socket.on("disconnect", () => {
    UserManager.removeUser(socket.id);
    console.log(`User ${socket.id} disconnected.`);
  });
});

const PORT = process.env.PORT || 3100;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

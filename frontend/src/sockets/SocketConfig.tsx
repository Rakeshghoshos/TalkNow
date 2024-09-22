import { io, Socket } from "socket.io-client";
import environment from "../env.d"; 

let socket: Socket | null = null;

export const initiateSocketConnection = () => {
  if (!socket) {
    socket = io("https://talk-now-virid.vercel.app", {
  transports: ["websocket", "polling"], // Ensure the correct transports
  withCredentials: true, // Important for handling cookies and credentials
});
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });
  }
  };

  export const getSocket = (): Socket | null=> {
      return socket;
  };

  export const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      console.log("Disconnected from WebSocket");
    }
  };

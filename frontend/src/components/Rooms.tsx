import { useEffect, useRef, useState } from "react";
import { useSocket } from "../sockets/SocketContext";
import WebRtcServices from "../services/webrtc";

function Rooms({
  localAudioTrack,
  localVideoTrack,
}: {
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { socket } = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);


  // Display local video stream
  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      const stream = new MediaStream([localVideoTrack]);
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.onloadedmetadata = () => {
        localVideoRef.current?.play().catch((e) => console.error("Error playing video:", e));
      };
    }
  }, [localVideoTrack]);

  // Add local tracks to WebRTC peer connection
  useEffect(() => {
    if (WebRtcServices.peer) {
      if (localAudioTrack) {
        WebRtcServices.peer.addTrack(localAudioTrack, new MediaStream([localAudioTrack]));
      }
      if (localVideoTrack) {
        WebRtcServices.peer.addTrack(localVideoTrack, new MediaStream([localVideoTrack]));
      }
    }
  }, [localAudioTrack, localVideoTrack]);

  useEffect(() => {
    if (WebRtcServices.peer) {
      // Log ICE candidate gathering state
      WebRtcServices.peer.onicegatheringstatechange = () => {
        console.log("ICE gathering state changed to:", WebRtcServices.peer.iceGatheringState);
      };
      // Log ICE connection state
      WebRtcServices.peer.oniceconnectionstatechange = () => {
        console.log("ICE connection state changed to:", WebRtcServices.peer.iceConnectionState);
        if (WebRtcServices.peer.iceConnectionState === "connected") {
          console.log("ICE connection established successfully.");
        } else if (WebRtcServices.peer.iceConnectionState === "failed" || WebRtcServices.peer.iceConnectionState === "disconnected") {
          console.error("ICE connection failed or disconnected.");
        }
      };
  
      // Log signaling state changes
      WebRtcServices.peer.onsignalingstatechange = () => {
        console.log("Signaling state changed to:", WebRtcServices.peer.signalingState);
      };
  
      // Log peer connection state changes
      WebRtcServices.peer.onconnectionstatechange = () => {
        console.log("Peer connection state changed to:", WebRtcServices.peer.connectionState);
        if (WebRtcServices.peer.connectionState === "connected") {
          console.log("Peer connection established successfully.");
        } else if (WebRtcServices.peer.connectionState === "failed" || WebRtcServices.peer.connectionState === "disconnected") {
          console.error("Peer connection failed or disconnected.");
        }
      };
    } else {
      console.error("WebRtcServices.peer is not initialized.");
    }
  }, []);
   
  // Handle socket events
  useEffect(() => {
    if (socket) {
      // Join Room
      socket.on("joinRoom", (data) => {
        if (data && data.roomId) {
          socket.emit("joinRoom", { roomId: data.roomId });
          setRemoteSocketId(data.user1);
          setRoomId(data.roomId);
          console.log(roomId);
        }
      });

      // Handle incoming call offer
      socket.on("incomingCall", async (data) => {
        if (WebRtcServices.peer.signalingState === "stable") {
          const answer = await WebRtcServices.sendAnswer(data.offer);
          socket.emit("accepted", { id: data.id, ans: answer });
        }
      });

      // Handle call acceptance
      socket.on("accepted", async (data) => {
        await WebRtcServices.peer.setRemoteDescription(data.ans);
      });

      // Handle negotiation requests
      socket.on("negotiation", async (data) => {
        if (WebRtcServices.peer.signalingState === "stable") {
          const answer = await WebRtcServices.sendAnswer(data.offer);
          socket.emit("negotiation-done", { id: data.id, ans: answer });
        }
      });

      socket.on("negotiation-final", async (data) => {
        await WebRtcServices.peer.setRemoteDescription(data.ans);
      });
    }

    return () => {
      socket?.off("joinRoom");
      socket?.off("incomingCall");
      socket?.off("accepted");
      socket?.off("ice-candidate");
      socket?.off("negotiation");
      socket?.off("negotiation-final");

    };
  }, [socket]);


  useEffect(() => {
    if (socket && remoteSocketId) {
      // Handle receiving ICE candidates
      socket.on("ice-candidate", (data) => {
        console.log("Received ICE candidate:", data.candidate);
        WebRtcServices.addIceCandidate(data.candidate).catch((error) => {
          console.error("Error adding received ICE candidate:", error);
        });
      });

      // Handle sending ICE candidates
      WebRtcServices.peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate:", event.candidate);
          socket.emit("ice-candidate", { candidate: event.candidate, remoteSocketId });
        } else {
          console.log("ICE candidate gathering completed.");
        }
      };

      // Cleanup on unmount
      return () => {
        socket.off("ice-candidate");
        WebRtcServices.peer.onicecandidate = null;
      };
    }
  }, [socket, remoteSocketId]);
  
  // Handle negotiation needed event
  useEffect(() => {
    const handleTrackEvent = (event: RTCTrackEvent) => {
      if (event.streams && event.streams.length > 0) {
        const remoteStream = event.streams[0];
        console.log("Video tracks:", remoteStream.getVideoTracks());
        console.log("Audio tracks:", remoteStream.getAudioTracks());
    
        if (remoteStream.getVideoTracks().length > 0 && remoteVideoRef.current) {
          const videoTrack = remoteStream.getVideoTracks()[0];
          if (videoTrack.readyState === 'live') { // Check if the track is live
            console.log("Setting video srcObject.");
            remoteVideoRef.current.pause(); // Pause before setting a new source
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.onloadedmetadata = () => {
              console.log("Remote video metadata loaded, playing video...");
              remoteVideoRef.current?.play().catch((e) => console.error("Error playing remote video:", e));
            };
          } else {
            console.warn("Video track is not live.");
          }
        } else {
          console.warn("No video tracks found in the remote stream.");
        }
      } else {
        console.warn("No streams found in track event.");
      }
    };
    
    WebRtcServices.peer.addEventListener("track", handleTrackEvent);
    
    return () => {
      WebRtcServices.peer.removeEventListener("track", handleTrackEvent);
    };
  }, [remoteVideoRef]);
  
  
  // Join the lobby and create a room
  const joinLobby = async () => {
    if (socket) {
      socket.emit("roomCreate", "");
      socket.on("roomCreated", async (data) => {
        if (data && data.user2 && data.roomId) {
          setRemoteSocketId(data.user2);
          setRoomId(data.roomId);
          const offer = await WebRtcServices.sendOffer();
          socket.emit("offer", { remoteSocketId: data.user2, offer });
        }
      });

      socket.on("no-one", (data) => {
        alert(data.message);
      });
    }
  };

  return (
   <>
     <div className="w-full h-3/4 flex justify-center items-center flex-col">
      <video autoPlay width={400} height={400} ref={localVideoRef} /><br />
      <button className="w-20 h-10 bg-blue-600 text-yellow-50 rounded-3xl" onClick={joinLobby}>
        Call
      </button>
      </div>
      {remoteVideoRef && <div className="w-full h-3/4 flex justify-center items-center flex-col">
        <video ref={remoteVideoRef} autoPlay playsInline muted width={400} height={400} />
      </div> }
   </>
  );
}

export default Rooms;

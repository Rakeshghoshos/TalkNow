import { useState ,useRef ,useEffect} from "react";
import { useSocket } from "../sockets/SocketContext";
import { disconnectSocket } from "../sockets/SocketConfig";
import Rooms from "./Rooms";
function HomePage() {
  const  { socket }  = useSocket();
  const [joined,setJoined] = useState(false);
  const [localVideoTrack,setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const[localAudioTrack,setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const getCam = async()=>{
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video:true,
      audio:true
    });

    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];
    setLocalAudioTrack(audioTrack);
    setLocalVideoTrack(videoTrack);
    if(!videoRef.current){
      return;
    }
    videoRef.current.srcObject = new MediaStream([videoTrack])
    videoRef.current.play();
  }

  useEffect(() => {
    if (videoRef && videoRef.current) {
      getCam()
  }
  }, [videoRef])

  const handleJoin = ()=>{
    if (socket) {
      socket.emit("join", { socketId: socket.id });
    }
  }

  useEffect(() => {
    if(socket){
      socket.on("joined",()=>{
        setJoined(true);
      });
    }
  
    return () => {
      socket?.off("joined");
    };
  }, [socket,joined]);
  
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnectSocket();
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

 if(!joined){
  return (
    <div className="w-screen h-screen ">
      <div className="w-full h-1/4 flex justify-center items-center flex-col">
        <h1 className="text-3xl font-bold underline">Welcome to TalkNow</h1><br/>
        <p>
          A live video sharing app where you can talk to 
          random people all over the world !!!!
        </p>
      </div>
      <div className="w-full h-3/4 flex justify-center items-center flex-col">
      <video autoPlay ref={videoRef} width={550}></video><br/>
      <button className="w-20 h-10 bg-blue-600 text-yellow-50 rounded-3xl" onClick={handleJoin}>Join</button>
      </div>
    </div>
  )
 }

 return <Rooms localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />
}

export default HomePage
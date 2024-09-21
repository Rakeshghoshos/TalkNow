import React, { createContext, useContext, useEffect ,useState} from "react";
import { initiateSocketConnection,getSocket, disconnectSocket} from "./SocketConfig";

interface SocketContextProps {
    socket: ReturnType<typeof getSocket>;
}

const SocketContext = createContext<SocketContextProps | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<ReturnType<typeof getSocket>>(null);

  useEffect(() => {
    initiateSocketConnection();
    const currentSocket = getSocket();
    if (currentSocket) {
      setSocket(currentSocket);
    }

    return () => {
      disconnectSocket();
    };

  }, []);
    
    return (
      <SocketContext.Provider value={{ socket }}>
        {children}
      </SocketContext.Provider>
    );
  };

  export const useSocket = (): SocketContextProps => {
    const context = useContext(SocketContext);
    if (!context) {
      throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
  };
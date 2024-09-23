import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager.js";

export interface Users{
    socket:Socket
}
export class UserManager{
    static users: Users[];
    static queue: string[];

    Constructor(){
        this.users = [];
        this.queue = [];
    }

    static addUser(socket:Socket){
        UserManager.users.push({socket:socket});
        UserManager.queue.push(socket.id);
    }

    static removeUser(socketId:string){
        UserManager.users = UserManager.users.filter((u:any)=> u.socket.id !== socketId);
        UserManager.queue = UserManager.queue.filter(x => x !== socketId);
    }

    static maintainQueue(id:any,roomId:any,socketIds:any): any{
        if(roomId && socketIds && socketIds?.length > 0){
            RoomManager.removeRoom(roomId);
            UserManager.queue.push(...socketIds);
        }

        if(UserManager?.users?.length < 2){
            return null;
        }
        let index = UserManager.queue.findIndex((u:any) => u.toString() == id.toString());
        let user1 = UserManager.queue.splice(index, 1)[0];;
        let user2 = UserManager.queue.shift();

        if(user1 && user2){
            let roomId = RoomManager.createRoom(user1,user2);
            return {roomId ,user1,user2};
        }
        return null;
    }
}

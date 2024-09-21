import { nanoid } from 'nanoid';

interface Room {
    user1: string | null,
    user2: string | null,
}
const generateUniqueId = (size=10): string => {
    return nanoid(size);
  };

export class RoomManager{
    static rooms: Map<string, Room>[] = [];

    static createRoom(user1:string | null,user2:string | null){
        const roomId = generateUniqueId().toString();
        let con = new Map<string, Room>();
        con.set(
            roomId,
            {
                user1, 
                user2,
            });

        RoomManager.rooms.push(con);
        return roomId;
    }

    static removeRoom(roomId:string){
        RoomManager.rooms = RoomManager.rooms.filter((r)=> !r.has(roomId));
    }
}
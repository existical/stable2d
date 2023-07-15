interface IEntityCollection<T> {
    [key: string]: T;
}

const roomStore: IEntityCollection<Room> = {};

export interface IRoom {
    roomName: string;
    createFunction: Function;
}

export class Room {
    private static _currentRoom: Room | undefined;
    private static _previousRoom: Room | undefined;
    private static _isRoomStart: boolean = false;
    private static _isRoomEnd: boolean = false;
    

    createFunction: Function;
    private _roomName: string;
    private constructor(roomConfig: IRoom) {

       const { roomName, createFunction } = roomConfig;

        this.createFunction = createFunction;
        roomStore[roomName] = this;
        this._roomName = roomName;
    }

    get roomName(): string {
        return this._roomName;
    }

    start() {
        Room._currentRoom = this;
        Room.isRoomStart = true;
        this.createFunction();
    }

    // static create(roomName: string, createFunction: Function): Room {
    //     const room = new Room(roomName, createFunction);
    //     return room;
    // }

    static create(roomConfig: IRoom) {
        return new Room( roomConfig );
    }

    // Get sprite from the spriteStore object by it's name
    static getRoomByName(key: string): Room | undefined {
        return roomStore[key];
    }

    static getCurrentRoom(): Room | undefined {
        return Room._currentRoom;
    }

    static getPreviousRoom(): Room | undefined {
        return Room._previousRoom;
    }

    static setPreviousRoom(room: Room) {
        Room._previousRoom = room;
    }

    static get isRoomStart() {
        return Room._isRoomStart;
    }

    static set isRoomStart(value: boolean) {
        Room._isRoomStart = value;
    }

    static get isRoomEnd() {
        return Room._isRoomEnd;
    }

    static set isRoomEnd(value: boolean) {
        Room._isRoomEnd = value;
    }


}
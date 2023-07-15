import { GameObject, IGameObject } from '.';

export class GameObjectGeneric extends GameObject {

    constructor(args: IGameObject) {
        super(args);
    }

    eventBeginStep() {}
    eventStep() {}
    eventEndStep() {}
    eventMouseEnter() {}
    eventMouseLeave() {}
    eventMouseScrollUp() {}
    eventMouseScrollDown() {}
    eventClick() {}
    eventClickGlobal() {}

    eventDestroy() {}
    eventRoomStart() {}
    eventRoomEnd() {}
    eventCleanup() {}

    eventDrawBegin() {}
    eventDrawEnd() {}
    eventDraw() {
        this.drawSelf();
    }
    eventDrawGUI() {}
}
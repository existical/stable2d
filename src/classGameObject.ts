import { GameEngine, Sprite, Room } from '.';
import { isFunctionNotEmpty, drawRectangleRotated, getBoxRotated, checkPointInPolygon, deleteObjectKeys } from '.';

let indexCounter = 0; // In closure of WithAutoIncrementedIndex class

export interface GameObjectCallback<T extends GameObject> {
  (gameObject: T): void;
}

export interface PropsObject {
  [key: string]: any;
};

export type NumbersObject = {
  [key: string]: number;
};

export type StringsObject = {
  [key: string]: string;
};

export type BooleansObject = {
  [key: string]: boolean;
};

interface StateObject {
  [key: string]: string | number | boolean;
}

export interface IGameObject { 
  x?: number;
  y?: number;
  z?: number;
  is_persistent?: boolean;
  is_visible?: boolean;
  sprite?: Sprite;
  image_speed?: number;
};

export abstract class GameObject {
  static GameObjectInstances: Array<GameObject> = [];

  index: number;
  x: number = 0;
  y: number = 0;
  private _z: number = 0;
  xstart: number;
  ystart: number; 
  is_persistent: boolean = false;
  is_visible: boolean = true;
  private _sprite?: Sprite;
  private _image_speed: number = 1;
  private _frameStepCount = 0;
  private _image_index: number = 0; // Because of 'delta time' usage the '_image_index' will always be a float number.
  private _image_xscale: number = 1;
  private _image_yscale: number = 1;
  private _is_mouse_over: boolean = false;
  private _is_gui_mouse_over: boolean = false; // Mouse collision check at Draw GUI level
  private _event_implemented_mouse_track: boolean = false; // If eventMouseEnter() and eventMouseLeave() methods are implemented, will be set to true
  private _event_implemented_mouse_scroll: boolean = false;
  private _isDeleted: boolean = false;
  private _image_angle: number = 0;
  private _image_alpha: number = 1;

  prop: PropsObject = {}; // Any
  num: NumbersObject = {}; // Number
  str: StringsObject = {}; // String
  bool: BooleansObject = {}; // Boolean

  state: StateObject = {}; // For storing variables that would be synchronized with remote server for multiplayer games
  
  constructor({x, y, z, is_persistent, is_visible, sprite }: IGameObject ) {
    this.index = indexCounter++;
    GameObject._addObjectInstance(this);
    
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    this.z = z ?? this.z;
    this.xstart = this.x;
    this.ystart = this.y;
    this.is_persistent = is_persistent ?? this.is_persistent;
    this.is_visible = is_visible ?? this.is_visible;
    this.sprite = sprite ?? this.sprite;

    // CHECK IF METHODS ARE IMPLEMENTED
    if (isFunctionNotEmpty(this.eventMouseEnter) || isFunctionNotEmpty(this.eventMouseLeave)) {
      this._event_implemented_mouse_track = true;
    }
    if (isFunctionNotEmpty(this.eventMouseScrollUp) || isFunctionNotEmpty(this.eventMouseScrollDown)) {
      this._event_implemented_mouse_scroll = true;
    }
    
  }

  get z() {
    return this._z;
  }

  set z( z: number ) {
    this._z = z;
    GameObject.sortObjectInstancesByZ();
  }

  get sprite(){
    return this._sprite;
  }

  set sprite(sprite){
    this._sprite = sprite;
    this._image_index = 0;
  }

  get image_angle() {
    return this._image_angle;
  }
  set image_angle(angle: number){
    this._image_angle = angle;
  }

  get image_alpha() {
    return this._image_angle;
  }
  set image_alpha(alpha: number){
    if(alpha > 1) {
      this._image_alpha = 1;
    } else if(alpha < 0) {
      this._image_alpha = 0;
    } else {
      this._image_alpha = alpha;
    }
  }

  get image_xscale() {
    return this._image_xscale;
  }
  set image_xscale(xscale: number) {
    this._image_xscale = xscale;
  }

  get image_yscale() {
    return this._image_yscale;
  }
  set image_yscale(yscale: number) {
    this._image_yscale = yscale;
  }

  get image_speed() {
    return this._image_speed;
  }
  set image_speed(speed: number) {
    if(speed != this.image_speed) {
      this._image_speed = speed;
    }
  }

  get image_index() {
    let img_idx = Math.round(this._image_index);

    if (img_idx >= this.image_number) {
      img_idx = 0;
    }
    return img_idx;
  }

  get image_number(): number {
    if(this._sprite) {
      return this._sprite.frames;
    } else {
      return 0;
    }
  }

  get is_mouse_over(): boolean {

    if(!this._event_implemented_mouse_track) {
      if(this.isPointCollision(GameEngine.getMouseX(), GameEngine.getMouseY())) {
        if (!this._is_mouse_over) {
          this._is_mouse_over = true;
        }
      } else {
        if (this._is_mouse_over) {
          this._is_mouse_over = false;
        }
      }
    }

    return this._is_mouse_over;
  }

  get is_gui_mouse_over(): boolean {

    if(!this._event_implemented_mouse_track) {
      if(this.isPointCollision(GameEngine.getGUIMouseX(), GameEngine.getGUIMouseY())) {
        if (!this._is_gui_mouse_over) {
          this._is_gui_mouse_over = true;
        }
      } else {
        if (this._is_gui_mouse_over) {
          this._is_gui_mouse_over = false;
        }
      }
    }

    return this._is_gui_mouse_over;
  }

  get isDeleted() {
    return this._isDeleted;
  }

  set image_index(index: number) {
    this._image_index = index;
  }

  // Step Events {{
  abstract eventBeginStep():void; // Begin Step event
  abstract eventStep():void; // Step Event
  abstract eventEndStep():void; // End Step event
  // Step Events }}

  // Mouse Events {{
  abstract eventMouseEnter():void; //Mouse Enter
  abstract eventMouseLeave():void; // Mouse Leave
  abstract eventClick():void; // Mouse left released on the object
  abstract eventClickGlobal():void; // Mouse left released globally

  abstract eventMouseScrollUp():void; //Mouse Scroll Up
  abstract eventMouseScrollDown():void; //Mouse Scroll Down
  // Mouse Events }}

  // Misc Events {{
  abstract eventDestroy():void; // Trigger on object Destroy event. Not triggered on RoomEnd event.
  abstract eventRoomStart():void; // Trigger all objects after room has started
  abstract eventRoomEnd():void; // Trigger all objects after room has started
  abstract eventCleanup():void; // Triggers no matter what way the object is destroyed.
  
  // Misc Events }}

  // Draw Events {{
  abstract eventDrawBegin(): void; // Draw Begin event
  abstract eventDrawEnd(): void; // Draw End event
  abstract eventDraw(): void; // Draw event  //  { this.drawSelf(ctx); }
  abstract eventDrawGUI(): void; // Draw event
  // Draw Events }}

  drawSelf(): void {
    if(this.is_visible && GameEngine.isDrawable && GameEngine.context) {
      this._drawFrame(GameEngine.context, this.image_index);
    }
  }

  _draw(){
    if(this.is_visible && GameEngine.isDrawable) {
      this.eventDraw();
    }
  }

  _drawBegin(){
    if(this.is_visible && GameEngine.isDrawable) {
      this.eventDrawBegin();
    }
  }

  _drawEnd(){
    if(this.is_visible && GameEngine.isDrawable) {
      this.eventDrawEnd();

      // DEBUG DRAW
      if(GameEngine.getGlobal('debug', 'isBoolean') /* || this.is_mouse_over */) {
        this._drawDebugData();
      }
      // DEBUG DRAW

    }
  } 

  _drawGUI(){
    if(this.is_visible && GameEngine.isDrawable) {
      this.eventDrawGUI();
    }
  }

  _drawDebugData() {
    if(GameEngine.context) {
      const ctx = GameEngine.context;
      // Draw two short lines to show the sprite origin
      ctx.strokeStyle = 'cyan';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x - 15, this.y);
      ctx.lineTo(this.x + 15, this.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 15);
      ctx.lineTo(this.x, this.y + 15);
      ctx.stroke();

      this.drawSpriteBorders(ctx);

      ctx.font = '16px OswaldSemiBold';
      ctx.fillStyle = 'cyan';
      ctx.fillText(`is_persistent: ${this.is_persistent}`, this.x, this.y-20);
    }
  }

  _drawFrame(ctx: CanvasRenderingContext2D, frameIndex: number) {
    if(this.sprite) {
      // this.sprite.draw(ctx, this.x, this.y, this.image_index);
      this.sprite.drawExt(ctx, this.x, this.y, this.image_index, this.image_xscale, this.image_yscale, this.image_angle, 1);
    }
  }

  _frameNext() {
    if (this._sprite) {
      const frameStep = (this._sprite.fps * this._image_speed) / 60;
      this._frameStepCount += frameStep;

      const wholePart = Math.floor(this._frameStepCount);  // returns whole part
      this._frameStepCount = this._frameStepCount - wholePart;   // returns fraction

      for(let i=0; i<wholePart; i++) {
        this._image_index += GameEngine.DTM;
        if (this._image_index >= this.image_number) {
          this._image_index = 0;
        }
      }
    }
  }

  // _runCallback(func: Function | null = null): void {
  //   if(func) {
  //     func();
  //   }
  // }

  private drawSpriteBorders(ctx: CanvasRenderingContext2D) {
    if(this.sprite) {
      drawRectangleRotated(ctx, this.x, this.y, this.x+this.sprite.width, this.y+this.sprite.height, this.sprite.xoffset, this.sprite.yoffset, this.image_xscale, this.image_yscale, this.image_angle, 2, 'cyan');
    }
  }

  isPointCollision(x: number, y: number): boolean {

    // if(this.sprite !== undefined) {
    //   return this.sprite.isCollision(x, y, this.x, this.y);
    // } else {
    //   return false;
    // }

    if(this.sprite) {
    const box = getBoxRotated(this.x, this.y, this.x+this.sprite.width, this.y+this.sprite.height, this.sprite.xoffset, this.sprite.yoffset, this.image_xscale, this.image_yscale, this.image_angle);
      return checkPointInPolygon([{ x:box.x1, y:box.y1},{ x:box.x2, y:box.y2}, {x:box.x3, y:box.y3}, {x:box.x4, y:box.y4},], x, y);
    } else {
      return false;
    }

  }

  private alarms: { [id: number]: NodeJS.Timeout } = {};
  private nextAlarmId = 0;

  setAlarm(delay: number, callback: () => void): number {
    const id = this.nextAlarmId++;
    this.alarms[id] = setTimeout(() => {
      delete this.alarms[id];
      callback();
    }, delay);
    return id;
  }

  clearAlarm(id: number): void {
    clearTimeout(this.alarms[id]);
    delete this.alarms[id];
  }

  clearAllAlarms() {
    Object.keys(this.alarms).forEach(id => {
      this.clearAlarm(+id);
    });
  }

  destroy() {
    this.eventDestroy();
    // this.clearAllAlarms();
    // this._isDeleted = true;
    // this.is_visible = false;
    this.eliminate();
  }

  // Eliminating object means it gets eliminated without triggering the 'Destroy' event
  eliminate() {
    if(!this._isDeleted) { // Make sure we can't eliminate one instance twice, for example if the instance is deleted and room ends during the same step
      this.eventCleanup(); // Last event that triggers no matter what way the object is destroyed
      this.clearAllAlarms();
      this._isDeleted = true;
      this.is_visible = false;
    }
  }

  // ------- {{ STATIC ------- {{ STATIC ------- {{ STATIC ------- {{ STATIC ------- {{ STATIC

  // Adds GameObject instance to 'instances' array
  private static _addObjectInstance(inst: GameObject) {
    GameObject.GameObjectInstances.push(inst);
  }

  // Removes GameObject instance from 'instances' array
  private static _removeObjectInstance(inst: GameObject) {
    const index = GameObject.GameObjectInstances.indexOf(inst);
    if (index !== -1) {
      deleteObjectKeys(inst);
      GameObject.GameObjectInstances.splice(index, 1);
    }
  }

  private static _removeAllDeletedObjectInstances(instances: GameObject[]) {
    // const instances = this.getObjectInstances();
    instances.forEach(function (inst) {
      if(inst._isDeleted){
        GameObject._removeObjectInstance(inst);
      }
    });
  }

  public static eliminateNonPersistentInstances(): void {
    const instances = this.getObjectInstances();
    instances.forEach(function (inst) {
      if(!inst.is_persistent){
        inst.eliminate();
      }
    });
  }

  // Return array of all object instances
  public static getObjectInstances(): Array<GameObject> {
      return GameObject.GameObjectInstances;
  }

  public static sortObjectInstancesByZ(): void {
    GameObject.GameObjectInstances = GameObject.GameObjectInstances.sort((a, b) => (a.z || 0) - (b.z || 0));
    // instances = Obj.sortByZ(instances);
  }

  // Return one object instance by its index
  public static getObjectInstanceWithIndex(index: number): GameObject | undefined {
    let filteredInstance = GameObject.GameObjectInstances.filter(inst => inst.index === index);
    return filteredInstance.length > 0 ? filteredInstance[0] : undefined;
  }

  public static runAllBeginStep(instances: GameObject[]): void {
    instances.forEach(function (inst) {
      if(!inst._isDeleted) {
        inst.eventBeginStep();
      }
    }); 
  }

  public static runAllStep(instances: GameObject[]): void {
    instances.forEach(function (inst) {
      if(!inst._isDeleted) {
        inst.eventStep();
      }
    }); 
  }

  public static runAllEndStep(instances: GameObject[]): void {
    instances.forEach(function (inst) {
      if(!inst._isDeleted) {
        inst.eventEndStep();
      }
    }); 
  }

  public static runAllDraw(instances: GameObject[]): void {
    if(GameEngine.context && GameEngine.camera) {
      // Update the canvas
      GameEngine.camera.updateCanvas(GameEngine.context);

      instances.forEach(function (inst) {
        if(!inst._isDeleted) {
          inst._frameNext()
          inst._drawBegin();
        }
      });

      instances.forEach(function (inst) {
        if(!inst._isDeleted) {
          inst._draw();
        }
      });
      instances.forEach(function (inst) {
        if(!inst._isDeleted) {
          inst._drawEnd();
        }
      });

      GameEngine.camera?.restoreCanvas(GameEngine.context);

      instances.forEach(function (inst) {
        if(!inst._isDeleted) {
          inst._drawGUI();
        }
      });
    }
  }

  // public static runAllDrawGUI(instances: GameObject[]): void {
  //   if(GameEngine.ctx) {
  //     instances.forEach(function (inst) {
  //         inst._drawGUI(GameEngine.ctx);
  //     });
  //   }
  // }

  public static allClickedEvents(x: number, y: number): void {
    const instances = this.getObjectInstances();
    instances.forEach(function (inst) {
      if(!inst._isDeleted){
        if(inst.isPointCollision(x, y)){
          // console.log('Clicked', Object.getPrototypeOf(inst).constructor.name);
          inst.eventClick();
        }
        inst.eventClickGlobal();
      }
    });
  }

  // public static allMouseMoveEvents(instances: GameObject[], mouseX: number, mouseY: number): void {
  public static allMouseMoveEvents(instances: GameObject[]): void {
    
    instances.forEach(function (inst) {

      if(inst._event_implemented_mouse_track) {
        if(inst.isPointCollision(GameEngine.getGUIMouseX(), GameEngine.getGUIMouseY())){

          if (!inst._is_mouse_over) {
            inst._is_mouse_over = true;
            inst.eventMouseEnter();
          }

          // console.log('MOUSE OVER:', Object.getPrototypeOf(inst).constructor.name);
          
        } else {
          if (inst._is_mouse_over) {
            inst._is_mouse_over = false;
            inst.eventMouseLeave();
          }

        }
      }
    });
  }

  public static allEventsMouseScrollUp(){
    const instances = this.getObjectInstances();
    instances.forEach(function (inst) {
      if(inst._event_implemented_mouse_scroll && !inst._isDeleted) {
        inst.eventMouseScrollUp();
      }
    });
  }

  public static allEventsMouseScrollDown(){
    const instances = this.getObjectInstances();
    instances.forEach(function (inst) {
      if(inst._event_implemented_mouse_scroll && !inst._isDeleted) {
        inst.eventMouseScrollDown();
      }
    });
  }

  public static runAllRoomStart(instances: GameObject[]): void {
    instances.forEach(function (inst) {
      if(!inst._isDeleted) {
        inst.eventRoomStart();
      }
    }); 
  }

  public static runAllRoomEnd(instances: GameObject[]): void {
    instances.forEach(function (inst) {
      if(!inst._isDeleted) {
        inst.eventRoomEnd();
      }
    }); 
  }

  public static runAllStepEvents() {
    
    const instances = GameObject.getObjectInstances();

    if(Room.isRoomStart) {
      GameObject.runAllRoomStart(instances);
    }

    GameObject.allMouseMoveEvents(instances);
    GameObject.runAllBeginStep(instances);
    GameObject.runAllStep(instances);
    GameObject.runAllEndStep(instances);

    if(Room.isRoomEnd) {
      console.log(`ROOM END HAPPENED`);
      GameObject.runAllRoomEnd(instances);

      GameObject.eliminateNonPersistentInstances();
    }

    GameObject.runAllDraw(instances);

    GameObject._removeAllDeletedObjectInstances(instances);
  }
  // ------- STATIC }} ------- STATIC }} ------- STATIC }} ------- STATIC }} ------- STATIC }}
}


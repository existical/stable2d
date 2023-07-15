import { Sprite, ISprite } from '.';
import { GameObject } from '.';
import { Room } from '.';
import { Camera } from '.';
import { GameObjectCallback } from '.';
import { fetchJsonData } from '.';
import { detectEnvironment } from '.';

// Define the singleton game engine instance

type TypeGuard<T> = (value: unknown) => value is T;

interface ISpritesDatabase {
  sprites: ISprite[];
}

export class GameEngine {
  // private static instance: GameEngine;
  static deltaTime: number = 0;
  static DTM: number = 1; // Delta Time Multiplier = FPS * deltaTime
  static FPS: number = 60;
  static isDrawable: boolean = false;
  static renderWidth: number = 1920;
  static renderHeight: number = 1080;

  static canvas: HTMLCanvasElement | undefined;
  static context: CanvasRenderingContext2D | undefined;
  static outputCanvas: HTMLCanvasElement  | undefined;
  static outputContext: CanvasRenderingContext2D | undefined;
  static camera: Camera | undefined;

  static mouseX: number;
  static mouseY: number;

  private static _sprites: any;

  private static _mouseWheel: boolean = false;
  private static _mouseWheelUp: boolean = false;
  private static _mouseWheelDown: boolean = false;

  private static _gameWidth: number;
  private static _gameHeight: number;

  private static _roomGoto: Room | null = null; // Will store Room to which we should go to after all step events finished 

  static downKeys: Set<string>; // Will trigger contunuously
  static pressedKeys: Set<string>; // Will trigger once when key was pressed
  static releasedKeys: Set<string>; // Will trigger once when key was released

  static _appName: string = '';

  static global: { [key: string]: unknown  } = {};
  
  static async initialize({ appName, spritesJsonPath = '', roomsArray, firstRoom, viewOptions } : { appName: string, spritesJsonPath: string, roomsArray: any[], firstRoom: string, viewOptions: any }) {

    GameEngine._appName = appName;

    // Detect environment and set isDrawable to true if running in browser
    if (detectEnvironment() === 'browser') {
      console.log(`Browser environment detected. 'isDrawable' is set to 'true'`);
      GameEngine.isDrawable = true;
    }

    // Load sprites.json file
    if (spritesJsonPath) {
      const spritesObject = await fetchJsonData<ISpritesDatabase>(spritesJsonPath);
      GameEngine.initSprites(spritesObject);
    }

    // Loop through roomsArray and create rooms
    roomsArray.forEach((room) => {
      Room.create( { roomName: room.roomName, createFunction: room.createFunction });
    });

    // GAME ENGINE SYSTEM VARIABLES {{{
    GameEngine.mouseX = 0;
    GameEngine.mouseY = 0;

    // GAME ENGINE SYSTEM VARIABLES }}}

    let lastTime: number = performance.now();
    let fps: number = 60;

    GameEngine.downKeys = new Set();
    GameEngine.pressedKeys = new Set();
    GameEngine.releasedKeys = new Set();

    if(GameEngine._sprites) {
      Sprite.createSpritesFromArray(GameEngine._sprites); // Load game sprites
    } else {
      throw new Error(`Sprites were not initialized!`);
    }

    // GRAPHICS INITIALIZATION {{{

    GameEngine.renderWidth = viewOptions.renderWidth ?? 1920;
    GameEngine.renderHeight = viewOptions.renderHeight ?? 1080;
    const viewportPositionX = viewOptions.viewportPositionX ?? 0;
    const viewportPositionY = viewOptions.viewportPositionY ?? 0;
    const viewportZoom = viewOptions.viewportZoom ?? 1;
    const viewportWidth = viewOptions.viewportWidth ?? 1920;

    GameEngine.outputCanvas = <HTMLCanvasElement> document.getElementById('canvas'); // Output Canvas

    GameEngine.canvas = document.createElement('canvas'); // Render canvas (for internal game engine rendering)
    GameEngine.canvas.width = GameEngine.renderWidth; // Render Canvas Width
    GameEngine.canvas.height = GameEngine.renderHeight; // Render Canvas Height

    GameEngine.camera = new Camera(viewportPositionX, viewportPositionY, viewportZoom, GameEngine.renderWidth, GameEngine.renderHeight);
    
    GameEngine.cameraSetViewWidth(viewportWidth);
    // GameEngine.cameraSetViewHeight(500);

    if(GameEngine.canvas && GameEngine.outputCanvas)
    {
      const outputContext = GameEngine.outputCanvas.getContext("2d");
      if (!outputContext || !(outputContext instanceof CanvasRenderingContext2D)) {
        throw new Error('Failed to get 2D context');
      }
      GameEngine.outputContext = outputContext;

      const context = GameEngine.canvas.getContext("2d");
      if (!context || !(context instanceof CanvasRenderingContext2D)) {
          throw new Error('Failed to get 2D context');
      }

      GameEngine.context = context;
      GameEngine._gameWidth = GameEngine.renderWidth;
      GameEngine._gameHeight = GameEngine.renderHeight;

      GameEngine.context.imageSmoothingEnabled = false;
      GameEngine.outputContext.imageSmoothingEnabled = false;

      // GRAPHICS INITIALIZATION }}}

      // MAIN GAME LOOP {{{
      function requestGameStep(callback: FrameRequestCallback): number {
        return window.requestAnimationFrame(callback) ||
          window.setTimeout(callback, 1000 / 60); // For Node.js where 'window.requestAnimationFrame' is not available
      }

      function step () {
        requestGameStep(step);
        let currentTime = performance.now();
        GameEngine.deltaTime = (currentTime - lastTime) * 0.001; // Calculate delta time
        GameEngine.DTM = GameEngine.FPS * GameEngine.deltaTime;
        lastTime = currentTime;
        // console.log('DT:',GameEngine.deltaTime);

        if (GameEngine.isDrawable && GameEngine.context && GameEngine.outputCanvas && GameEngine.outputContext) {
          GameEngine.context.clearRect(0, 0, GameEngine.renderWidth, GameEngine.renderHeight);
          GameEngine.outputContext.clearRect(0, 0, GameEngine.outputCanvas.width, GameEngine.outputCanvas.height);
        }

        // On each step we run all step events for all GameObjects
        GameObject.runAllStepEvents();
        
        GameEngine.resetEventVars();

        // At the end of the game loop the game engine will check if we need to go to another room
        GameEngine.checkForRoomChange();
        
        // Draw Render Canvas on top of the Output Canvas
        if(GameEngine.isDrawable && GameEngine.canvas && GameEngine.outputCanvas && GameEngine.outputContext) {
          GameEngine.outputContext.drawImage(GameEngine.canvas, 0, 0, GameEngine.renderWidth, GameEngine.renderHeight, 0, 0, GameEngine.outputCanvas.width, GameEngine.outputCanvas.height);
        }
      }

      requestGameStep(step);

      // MAIN GAME LOOP }}
      
      if(GameEngine.isDrawable && GameEngine.canvas && GameEngine.outputCanvas) {
        GameEngine.outputCanvas.style.cursor = 'none'; // Hide mouse cursor (MOUSE HIDE)

        // Detect mouse click
        document.addEventListener('click', (event) => {
          let canvas = <HTMLCanvasElement>event.target;
          let rect = canvas.getBoundingClientRect();
          let scaleX = GameEngine.renderWidth / rect.width;
          let scaleY = GameEngine.renderHeight / rect.height;
          let canvasX = (event.clientX - rect.left) * scaleX;
          let canvasY = (event.clientY - rect.top) * scaleY;

          // console.log('MOUSE CLICKED ***');
      
          GameObject.allClickedEvents(canvasX, canvasY);
        });

        // Detect mouse scroll
        document.addEventListener('wheel', (event) => {
          event.preventDefault();

          const delta = Math.sign(event.deltaY); // Get the direction of the scroll (-1 for up, 1 for down)
          if (delta === -1) {
            // The user scrolled up
            GameEngine._mouseWheelUp = true;
            GameEngine._mouseWheel = true;
            GameObject.allEventsMouseScrollUp();
            // console.log('Scrolled up');
          } else if (delta === 1) {
            // The user scrolled down
            GameEngine._mouseWheelDown = true;
            GameEngine._mouseWheel = true;
            GameObject.allEventsMouseScrollDown();
            // console.log('Scrolled down');
          }
        });

        // const canvas = <HTMLCanvasElement>event.target;

        // Add event listener for mousemove event on canvas
        GameEngine.outputCanvas.addEventListener('mousemove', (event) => {
          if(GameEngine.outputCanvas) {
            // Calculate cursor position relative to canvas element
            const rect = GameEngine.outputCanvas.getBoundingClientRect();

            let scaleX = GameEngine.renderWidth / rect.width;
            let scaleY = GameEngine.renderHeight / rect.height;
            GameEngine.mouseX = (event.clientX - rect.left) * scaleX;
            GameEngine.mouseY = (event.clientY - rect.top) * scaleY;
          }
        });

      }
    }

    document.addEventListener('keydown', (event) => {
      GameEngine.downKeys.add(event.code);
      GameEngine.pressedKeys.add(event.code);
    });

    document.addEventListener('keyup', (event) => {
      GameEngine.releasedKeys.add(event.code);
      GameEngine.downKeys.delete(event.code);
    });

    // Check if the 'Space' key is currently pressed
    /*
      if (GameEngine.pressedKeys.has('Space')) {
        console.log('The Space key is currently pressed');
      }

      // Check if the 'Enter' key was released
      if (GameEngine.releasedKeys.has('Enter')) {
        console.log('The Enter key was just released');
      }
    */

    // Check if the firstRoom exists in the roomStore object
    if (!Room.getRoomByName(firstRoom)) {
      throw new Error(`Room '${firstRoom}' does not exist.`);
    }

    // Start the game in the first room
    GameEngine.roomGoto(firstRoom);
  }
  // --------------------------------------- CONSTRUCTOR ENDS ----------------------------------------- }}}

  // static getInstance(): GameEngine {
  //   if (!GameEngine.instance) {
  //     GameEngine.instance = new GameEngine();
  //   }
  //   return GameEngine.instance;
  // }

  static get appName(): string {
    return GameEngine._appName;
  }

  static set appName(value: string) {
    GameEngine._appName = value;
  }

  static checkForRoomChange() {
    if(GameEngine._roomGoto) {
      GameEngine._roomGoto.start();
      GameEngine._roomGoto = null;
    }
  }

  static initSprites(spritesJson: any) {

    // if spritesJson is object, then make a deep copy of it and assign to GameEngine._sprites
    if(typeof spritesJson === 'object') {
      GameEngine._sprites = JSON.parse(JSON.stringify(spritesJson));
    } else {
      throw new Error(`Sprites were not initialized!`);
    }

  }

  // ----- Global Variables ----- {{{

  // Define your type guard functions here
  private static typeGuards: { [key: string]: TypeGuard<unknown> } = {
    isNumber(value: unknown): value is number {
      return typeof value === 'number';
    },
    isString(value: unknown): value is string {
      return typeof value === 'string';
    },
    isBoolean(value: unknown): value is boolean {
      return typeof value === 'boolean';
    },
    isArray<T>(value: unknown): value is T[] {
      return Array.isArray(value);
    }
    // Add more type guard functions as needed
  };

  // Gets Global Variable
  static getGlobal<T>(key: string, typeGuardName: 'isNumber' | 'isString' | 'isBoolean' | 'isArray'): T {
    const value = GameEngine.global[key];
    if (value === undefined) {
      throw new Error(`Global variable '${key}' does not exist.`);
    }

    const typeGuard = GameEngine.typeGuards[typeGuardName];
    if (!typeGuard || !typeGuard(value)) {
      throw new Error(`Global variable '${key}' has an incorrect type.`);
    }

    return value as T;
  }

  // Sets Global Variable
  static setGlobal<T>(key: string, value: T): void {
    GameEngine.global[key] = value;
  }

  // Checks the existence of a global variable
  static checkGlobal(key: string): boolean {
    return key in GameEngine.global;
  }

  // Unsets / destroys a global variable
  static unsetGlobal(key: string): void {
    delete GameEngine.global[key];
  }

  // ----- Global Variables ----- }}}


  static roomCreate(roomName: string, createFunction: Function) {
    Room.create( { roomName, createFunction });
  }

  static roomGoto(roomName: string) {
    // console.log(`Current room: ${Room.getCurrentRoom()}`);
    if(Room.getCurrentRoom()) {
      Room.isRoomEnd = true;
    }
      const nextRoom = Room.getRoomByName(roomName);
      GameEngine._roomGoto = nextRoom ? nextRoom : null;
  }

  // Restarts current room
  static roomRestart() {
    const currentRoom = Room.getCurrentRoom();
    if(currentRoom) {
      GameEngine.roomGoto(currentRoom.roomName);
    }
  }

  // Get sprite from the spriteStore object by it's name
  static getSprite(key: string): Sprite | undefined {
    return Sprite.getSprite(key);
  }

  static get gameWidth(): number {
    return GameEngine._gameWidth;
  }

  static get gameHeight(): number {
    return GameEngine._gameHeight;
  }


  // ----- Graphics ------ {{{

  static gfxSetTexfilter(enable: boolean) {
    if(GameEngine.context) {
      GameEngine.context.imageSmoothingEnabled = enable;
    }
  }

  static gfxGetTexfilter() {
    if(GameEngine.context) {
      return GameEngine.context.imageSmoothingEnabled;
    } else {
      return false;
    }
  }

  // ----- Graphics ----- }}}


  // ----- Camera ----- {{{

  // Method to get the width of the camera view
  static cameraGetViewWidth(): number {
    if (GameEngine.camera) {
      return GameEngine.gameWidth / GameEngine.camera.zoom;
    } else {
      return 0;
    }
  }

  // Method to get the height of the camera view
  static cameraGetViewHeight(): number {
    if (GameEngine.camera) {
    return GameEngine.gameHeight / GameEngine.camera.zoom;
    } else {
      return 0;
    }
  }

  // Method to set zoom of the camera view by supplied width
  static cameraSetViewWidth(value: number): void {
    if(GameEngine.camera) {
      GameEngine.camera.zoom = GameEngine.renderWidth / value;
    }
  }

  // Method to set zoom of the camera view by supplied height
  static cameraSetViewHeight(value: number): void {
    if(GameEngine.camera) {
      GameEngine.camera.zoom = GameEngine.renderHeight / value;
    }
  }

  // Method to get the X position of the camera view
  static cameraGetViewX(): number {
    if(GameEngine.camera) {
      return GameEngine.camera.x;
    } else {
      return 0;
    }
  }

  // Method to get the Y position of the camera view
  static cameraGetViewY(): number {
    if(GameEngine.camera) {
      return GameEngine.camera.y;
    } else {
      return 0;
    }
  }

  // Method to get the zoom of the camera view
  static cameraGetZoom(): number {
    if (GameEngine.camera) {
    return GameEngine.camera.zoom;
    } else {
      return 1;
    }
  }

  // Method to set the zoom of the camera view
  static cameraSetZoom(value: number): void {
    if(GameEngine.camera) {
      GameEngine.camera.zoom = value;
    }
  }

  // Method to set the position of the camera view
  static cameraSetViewPos(x: number, y: number): void {
    GameEngine.camera?.setPosition(x, y);
  };

  // Method to move the camera view by supplied X and Y values
  static cameraMove(x: number, y: number): void {
    GameEngine.camera?.move(x, y);
  };

  // ----- Camera ----- }}}


  // ----- Mouse ----- {{{
  
  static getGUIMouseX(): number {
    // return GameEngine.getInstance().mouseX;
    return GameEngine.mouseX;
  }

  static getGUIMouseY(): number {
    // return GameEngine.getInstance().mouseY;
    return GameEngine.mouseY;
  }

  static mouseWheel(): boolean {
    return GameEngine._mouseWheel;
  }

  static mouseWheelUp(): boolean {
    return GameEngine._mouseWheelUp;
  }

  static mouseWheelDown(): boolean {
    return GameEngine._mouseWheelDown;
  }

  static getMouseX(): number {
    // Calculate the scaled mouse position based on the camera zoom and position
    const scaledMouseX = (GameEngine.getGUIMouseX() / GameEngine.cameraGetZoom()) + GameEngine.cameraGetViewX();

    // Return the scaled mouse position
    return scaledMouseX;
  }

  static getMouseY(): number {
    // Calculate the scaled mouse position based on the camera zoom and position
    const scaledMouseY = (GameEngine.getGUIMouseY() / GameEngine.cameraGetZoom()) + GameEngine.cameraGetViewY();

    // Return the scaled mouse position
    return scaledMouseY;
  }

  // ----- Mouse ----- }}}


  // ----- Keyboard ----- {{{

  static keyDown(key: string): boolean {
    return GameEngine.downKeys.has(key);
  }
  static keyPressed(key: string): boolean {
    return GameEngine.pressedKeys.has(key);
  }
  static keyReleased(key: string): boolean {
    return GameEngine.releasedKeys.has(key);
  }

  /*
    Here is the list of keydown event codes for some common keys:
      Backspace: "Backspace"
      Tab: "Tab"
      Enter: "Enter"
      Shift: "ShiftLeft" or "ShiftRight"
      Control: "ControlLeft" or "ControlRight"
      Alt: "AltLeft" or "AltRight"
      Pause/Break: "Pause"
      Caps Lock: "CapsLock"
      Escape: "Escape"
      Spacebar: " "
      Page Up: "PageUp"
      Page Down: "PageDown"
      End: "End"
      Home: "Home"
      Left Arrow: "ArrowLeft"
      Up Arrow: "ArrowUp"
      Right Arrow: "ArrowRight"
      Down Arrow: "ArrowDown"
      Insert: "Insert"
      Delete: "Delete"
      0-9: "Digit0" to "Digit9"
      A-Z: "KeyA" to "KeyZ"
      F1-F12: "F1" to "F12"
    */
  
  // Keyboard }}}

  static resetEventVars() {
    GameEngine._mouseWheel = false;
    GameEngine._mouseWheelUp = false;
    GameEngine._mouseWheelDown = false;
    GameEngine.pressedKeys.clear();
    GameEngine.releasedKeys.clear();

    // When Room Start event already happened we need to reset the event variable so the event isn't triggered again
    if(Room.isRoomStart) {
      Room.isRoomStart = false;
    }

    if(Room.isRoomEnd) {
      Room.isRoomEnd = false;
    }
  }

  // Other game engine methods and properties...

  // ------------------ 'with' method and other methods related to getting GameObject instances {{{{ --------------------

  // Runs the callback function for all instances of a specific class that extends the GameObject class.
  public static withClass<T extends GameObject>(
    className: new (...args: any[]) => T,
    callback: GameObjectCallback<T>
  ): void {
    const instances: T[] = this.getAllInstancesOfClass(className);
    for (const instance of instances) {
      // callback(instance);
      if(!instance.isDeleted) {
        this.withInstance(instance, callback);
      }
    }
  }

  // Runs the callback function for a specific instance of a class that extends the GameObject class.
  public static withInstance<T extends GameObject>(
    instance: T,
    callback: GameObjectCallback<T>
  ): void {
    if(!instance.isDeleted) { callback(instance); }
  }

  /**
   * Checks if there are any instances of a specific class that extend the `GameObject` class.
   * @param className - The constructor function of the class to check.
   * @returns boolean - Indicates whether there are instances of the class.
   */
  public static isClassInstanceExists<T extends GameObject>(
    className: new (...args: any[]) => T
  ): boolean {
    const instances: T[] = this.getAllInstancesOfClass(className);
    return instances.length > 0;
  }

  // Returns an array of all instances of a specific class that extends the GameObject class.
  public static getAllInstancesOfClass<T extends GameObject>(className: new (...args: any[]) => T): T[] {
    const instances: GameObject[] = GameObject.GameObjectInstances;
    const filteredInstances: T[] = [];
    for (const instance of instances) {
      if (instance instanceof className && !instance.isDeleted) {
        filteredInstances.push(instance as T);
      }
    }
    return filteredInstances;
  }
  // ------------------ 'with' method and other methods related to getting GameObject instances {{{{ --------------------

  // static async loadSprites(jsonPath: string): Promise<any> {
  //   const response = await fetch(jsonPath);
  //   if (!response.ok) {
  //     throw new Error(`Failed to load ${jsonPath}`);
  //   }
  //   return response.json();
  // }
  
}
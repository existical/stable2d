import { Align } from '.';

let indexCounter = 0;
let instances: Array<Sprite> = [];

interface SpriteCollection {
  [key: string]: Sprite;
}

const DEG_TO_RAD = Math.PI / 180;

// type SpriteCollectionKeys = keyof SpriteCollection;

// interface IEntityCollection<T> {
//   [key: string]: T;
// }

// export const spriteStore: SpriteCollection = {};
// const spriteStore: IEntityCollection<Sprite> = {};

export interface ISprite {
  name: string, 
  src: string;
  width?: number; 
  height?: number; 
  xoffset?: number; 
  yoffset?: number; 
  valign?: Align | string;
  halign?: Align | string;
  xscale?: number; 
  yscale?: number; 
  frames?: number;
  fps?: number; 
  frame_delay?: number;
};

export class Sprite {
  private _name: string;
  index: number;
  // src: string;
  image: HTMLImageElement;
  width: number = 0;
  height: number = 0;
  xoffset: number = 0;
  yoffset: number = 0;
  _valign: Align | string = 'top'; // top, middle, bottom
  _halign: Align | string = 'left'; // left, center, right
  xscale: number = 1;
  yscale: number = 1;
  frames: number = 1;
  private _fps: number = 60;

  private constructor( options: ISprite) {
    this.index = indexCounter++;
    instances.push(this);

    this._name = options.name;
    Sprite.store[this._name] = this; // Adding current sprite to the 'spriteStore' object.

    this.image = new Image();
    this.image.src = 'assets/' + options.src;
    
    this.width = options.width ?? this.width;
    this.height = options.height ?? this.height;
    this.xscale = options.xscale ?? this.xscale;
    this.yscale = options.yscale ?? this.yscale;
    this.frames = options.frames ?? this.frames;

    this.fps = options.fps ?? this.fps;

    this.xoffset = options.xoffset ?? this.xoffset;
    this.yoffset = options.yoffset ?? this.yoffset;

    if(!options.xoffset && options.valign) {this.valign = options.valign;}
    if(!options.yoffset && options.halign) {this.halign = options.halign;}

    // this.valign = options.valign ?? this.valign;
    // this.halign = options.halign ?? this.halign;

    // console.log(Math.PI / 180);
  }

  get name(){
    return this._name;
  }

  get fps() {
    return this._fps;
  }

  set fps(value: number) {
    this._fps = value;
  }

  get halign(){
    return this._halign;
  }

  set halign (value: string) {
    this._halign = value;
    this.calculateOffsets(this.valign, this.halign);
  }

  get valign(){
    return this._valign;
  }

  set valign (value: string) {
    this._valign = value;
    this.calculateOffsets(this.valign, this.halign);
  }

  
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, frameIndex: number): void {
    this.drawScaled(ctx, x, y, frameIndex, 1, 1);
  }

  drawScaled(ctx: CanvasRenderingContext2D, x: number, y: number, frameIndex: number, xscale: number, yscale: number): void {
    ctx.drawImage(
      this.image,
      frameIndex * this.width,
      0,
      this.width,
      this.height,
      x - this.xoffset * this.xscale * xscale,
      y - this.yoffset * this.yscale * yscale,
      this.width * this.xscale * xscale,
      this.height * this.yscale * xscale
    );
  }

  drawScaledRotated(ctx: CanvasRenderingContext2D, x: number, y: number, frameIndex: number, xscale: number, yscale: number, angle: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * DEG_TO_RAD); // DEG_TO_RAD constant '0.017453292519943295' is the same as 'Math.PI / 180'
    ctx.drawImage(
      this.image,
      frameIndex * this.width,
      0,
      this.width,
      this.height,
      -this.xoffset * this.xscale * xscale,
      -this.yoffset * this.yscale * yscale,
      this.width * this.xscale * xscale,
      this.height * this.yscale * yscale
    );
    ctx.restore();
  }

  drawExt(ctx: CanvasRenderingContext2D, x: number, y: number, frameIndex: number, xscale: number, yscale: number, angle: number, alpha: number): void {
    // ctx.globalAlpha = 0.4;
    if(alpha !== 1) {ctx.globalAlpha = alpha;} // Set custom Alpha
    if(angle === 0) {
      this.drawScaled(ctx, x, y, frameIndex, xscale, yscale);
    } else {
      this.drawScaledRotated(ctx, x, y, frameIndex, xscale, yscale, angle);
    }
    if(alpha !== 1) {ctx.globalAlpha = 1;} // Restore from custom Alpha
  }

  // Get Sprite Bounding Box coordinates
  get bbox() {
    const left = -this.xoffset * this.xscale;
    const top = -this.yoffset * this.yscale;
    const right = this.width * this.xscale; // same as scaled Width
    const bottom = this.height * this.yscale; // same as scaled Height

    return {
      left,
      top,
      right,
      bottom
    }
  }

  isCollision(detectX: number, detectY: number, objX: number = 0, objY: number = 0): boolean {
    // detectX, detectY - coordinates of potential collision point we are detecting
    // objX, objY - coordinates of the sprite. For relative detection they are not required.
    
    // SIMPLE SQUARE COLLISION DETECTION {{{

    // Get the scaled width and height
    const width = this.width * this.xscale;
    const height = this.height * this.yscale;

    // Calculate the top left and bottom right coordinates of the frame
    const x1 = objX - this.xoffset * this.xscale;
    const y1 = objY - this.yoffset * this.yscale;
    const x2 = x1 + width;
    const y2 = y1 + height;
  
    return detectX >= x1 && detectX <= x2 && detectY >= y1 && detectY <= y2;
    // SIMPLE SQUARE COLLISION DETECTION }}}
  }

  // Calculate sprite Offsets
  private calculateOffsets(verticalAlign: string, horizontalAlign: string) {

    if(typeof verticalAlign === 'string'){
      switch (verticalAlign) {
        case 'top':
          this.yoffset = 0;
          break;
        case 'middle':
          this.yoffset = this.height / 2;
          break;
        case 'bottom':
          this.yoffset = this.height;
          break;
        default:
          throw new Error(`Invalid vertical alignment value: ${verticalAlign}`);
      }
    } 
    // else if(typeof verticalAlign === 'number'){
    //   this.yoffset = -verticalAlign;
    // }
  
    if(typeof horizontalAlign === 'string'){
      switch (horizontalAlign) {
        case 'left':
          this.xoffset = 0;
          break;
        case 'center':
          this.xoffset = this.width / 2;
          break;
        case 'right':
          this.xoffset = this.width;
          break;
        default:
          throw new Error(`Invalid horizontal alignment value: ${horizontalAlign}`);
      }
    } 
  }

  static store: SpriteCollection = {};

  
  // Get sprite from the spriteStore object by it's name
  // static getSprite(key: string): Sprite | undefined {
  //   return Sprite.store[key];
  // }

  static getSprite(key: string): Sprite {
    if (!(key in Sprite.store)) {
      throw new Error(`Sprite with key '${key}' not found`);
    }
    return Sprite.store[key];
  }

  // static getSprite(key: SpriteCollectionKeys): Sprite {
  //   const sprite = Sprite.store[key];
  //   if (!sprite) {
  //     throw new Error(`Sprite ${key} not found in store.`);
  //   }
  //   return sprite;
  // }

  // static getSprite<K extends keyof SpriteCollection>(key: K): SpriteCollection[K] | undefined {
  //   return Sprite.store[key];
  // }

  // static getSprite(key: keyof SpriteCollection): Sprite | undefined {
  //   return Sprite.store[key];
  // }

  // Creates new sprite
  static create(spr: ISprite) {
    return new Sprite(spr);
  }

  // Creates sprites from array of 'sprites' data objects
  static createSpritesFromArray(json: any) {
    const { sprites } = json;
  
    sprites.forEach((spr: ISprite) => {
        new Sprite(spr);
    });

  }

}

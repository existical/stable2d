// export * from './imports';
export * from './classGameObject'; // Abstract Class
export * from './classGameObjectGeneric';
export * from './GameEngine';
export * from './classCamera';
export * from './classRoom';
export * from './sysEnums';
export * from './classSprite';
export * from './functionsHelper';
export * from './functionsGml';
export * from './functionsVector';

import { Sprite } from './classSprite';

export interface IGameObject { 
    x?: number;
    y?: number;
    z?: number;
    is_persistent?: boolean;
    is_visible?: boolean;
    sprite?: Sprite;
    image_speed?: number;
  };

import { detectEnvironment } from './functionsHelper';
console.log(`Running in:`, detectEnvironment());
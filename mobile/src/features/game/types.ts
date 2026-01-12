export type GamePhase =
  | "IDLE"
  | "GROWING"
  | "ROTATING"
  | "WALKING"
  | "SCROLLING"
  | "FALLING";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

export type PlatformSnapshot = {
  x: number;
  w: number;
  index: number;
};

export type HeroSnapshot = {
  x: number;
  y: number;
  rotation: number;
};

export type StickSnapshot = {
  length: number;
  rotation: number;
};

export interface PlayerMove {
  startTime: number; // Integer ms relative to game start
  duration: number; // Integer ms
  idleDurationMs: number; // Integer ms spent in idle before press
  debug?: MoveClientDebug;
}

export type MoveClientDebug = {
  stickTip: number | null;
  bridgeLength: number | null;
  currentPlatformRight: number | null;
  nextPlatformIndex: number | null;
  platformX: number | null;
  platformRight: number | null;
  platformCenter: number | null;
  platformIsMoving: boolean | null;
};

export type EngineEvent =
  | { type: "score"; value: number }
  | { type: "perfect"; x: number; y: number }
  | { type: "gameOver"; value: number; seed: number; moves: PlayerMove[] }
  | { type: "revivePrompt"; value: number }
  | { type: "particles"; x: number; y: number; color: string; count: number };

export interface RenderState {
  phase: "IDLE" | "GROWING" | "ROTATING" | "WALKING" | "FALLING" | "SCROLLING";
  cameraX: number;
  shakeIntensity: number;
  hero: { x: number; y: number; rotation: number };
  stick: { length: number; rotation: number };
  platforms: PlatformSnapshot[];
  score: number;
}

export type ActionHandler = () => void | Promise<void>;

export type BridgeOverlayState =
  | "START"
  | "PLAYING"
  | "REVIVE"
  | "GAME_OVER";

export type GhostState = {
  active: boolean;
  expiresAt: number | null;
  used: boolean;
};

export type RevivePowerUpState = {
  activated: boolean;
  consumed: boolean;
};

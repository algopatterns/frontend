declare module "@strudel/codemirror" {
  export interface StrudelMirrorOptions {
    defaultOutput?: unknown;
    getTime?: () => number;
    transpiler?: unknown;
    root?: HTMLElement;
    initialCode?: string;
    pattern?: unknown;
    drawTime?: [number, number];
    drawContext?: CanvasRenderingContext2D;
    autodraw?: boolean;
    bgFill?: boolean;
    prebake?: () => Promise<void>;
    beforeEval?: () => Promise<void> | void;
    afterEval?: (options: unknown) => void;
    onToggle?: (started: boolean) => void;
    onUpdateState?: (state: { isDirty?: boolean; code?: string; activeCode?: string }) => void;
    onError?: (error: Error) => void;
  }

  export class StrudelMirror {
    constructor(options?: StrudelMirrorOptions);
    setCode(code: string): void;
    getCode(): string;
    evaluate(): Promise<void>;
    stop(): void;
    destroy(): void;
    setFontFamily?(font: string): void;
    setFontSize?(size: number): void;
    setLineNumbers?(show: boolean): void;
    setLineWrapping?(wrap: boolean): void;
    reconfigureExtension?(name: string, value: unknown): void;
  }
}

declare module "@strudel/core" {
  export function evalScope(...modules: Promise<unknown>[]): Promise<void>;
  export const silence: unknown;

  export class Pattern {
    constructor();
  }
}

declare module "@strudel/transpiler" {
  export const transpiler: unknown;
}

declare module "@strudel/webaudio" {
  export function getAudioContext(): AudioContext;
  export function initAudioOnFirstClick(options?: {
    maxPolyphony?: number;
    audioDeviceName?: string;
    multiChannelOrbits?: boolean;
  }): Promise<void>;
  export const webaudioOutput: unknown;
  export function registerSynthSounds(): Promise<void>;
  export function samples(
    url: string,
    options?: unknown,
    config?: { tag?: string }
  ): Promise<void>;
}

declare module "@strudel/draw" {
  export function getDrawContext(id?: string, options?: {
    contextType?: string;
    pixelated?: boolean;
    pixelRatio?: number;
  }): CanvasRenderingContext2D;
  export function cleanupDraw(clearScreen?: boolean, id?: string): void;
  const draw: unknown;
  export default draw;
}

declare module "@strudel/mini" {
  const mini: unknown;
  export default mini;
}

declare module "@strudel/tonal" {
  const tonal: unknown;
  export default tonal;
}

declare module "@strudel/soundfonts" {
  export function registerSoundfonts(): Promise<void>;
}

declare module "@strudel/sampler" {
  const sampler: unknown;
  export default sampler;
}

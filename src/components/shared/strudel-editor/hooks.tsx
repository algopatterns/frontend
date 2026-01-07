'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/lib/stores/editor';
import { useAudioStore } from '@/lib/stores/audio';
import { useWebSocketStore } from '@/lib/stores/websocket';
import { EDITOR } from '@/lib/constants';

export const SAMPLE_SOURCES = {
  doughSamples: 'https://raw.githubusercontent.com/felixroos/dough-samples/main',
  uzuDrumkit: 'https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main',
  dirtSamples:
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/strudel.json',
} as const;

export const INSTRUMENT_SHORTCUTS = [
  'piano',
  'guitar',
  'bass',
  'violin',
  'cello',
  'flute',
  'clarinet',
  'trumpet',
  'organ',
  'harp',
  'vibraphone',
  'marimba',
  'xylophone',
  'kalimba',
  'banjo',
  'sitar',
] as const;

export const DRUM_MACHINE_ALIASES: Record<string, string> = {
  tr505: 'RolandTR505',
  tr606: 'RolandTR606',
  tr626: 'RolandTR626',
  tr707: 'RolandTR707',
  tr727: 'RolandTR727',
  tr808: 'RolandTR808',
  tr909: 'RolandTR909',
  cr78: 'RolandCompurhythm78',
  lm1: 'LinnLM1',
  lm2: 'LinnLM2',
  linndrum: 'LinnDrum',
  dmx: 'OberheimDMX',
  sp12: 'EmuSP12',
  mpc60: 'AkaiMPC60',
  hr16: 'AlesisHR16',
  sr16: 'AlesisSR16',
};

export const DRUM_HIT_TYPES = [
  'bd',
  'sd',
  'hh',
  'oh',
  'cp',
  'lt',
  'mt',
  'ht',
  'rs',
  'cb',
  'cy',
  'rim',
  'cr',
  'rd',
];

export const SUPPRESSED_ERROR_PATTERNS = ['not found', 'duck target orbit'];

export interface StrudelMirrorInstance {
  code?: string;
  setCode: (code: string) => void;
  evaluate: () => Promise<void>;
  stop: () => void;
  destroy?: () => void;
  reconfigureExtension?: (name: string, value: unknown) => void;
  setFontFamily?: (font: string) => void;
  setFontSize?: (size: number) => void;
  setLineNumbers?: (show: boolean) => void;
  setLineWrapping?: (wrap: boolean) => void;
}

let strudelMirrorInstance: StrudelMirrorInstance | null = null;
let codePollingInterval: ReturnType<typeof setInterval> | null = null;
let getAudioContextFn: (() => AudioContext) | null = null;
let superdoughFn:
  | ((value: Record<string, unknown>, time: number, duration?: number) => Promise<void>)
  | null = null;

export function getStrudelMirrorInstance() {
  return strudelMirrorInstance;
}

export function setStrudelMirrorInstance(instance: StrudelMirrorInstance | null) {
  strudelMirrorInstance = instance;
}

export function getCodePollingInterval() {
  return codePollingInterval;
}

export function setCodePollingInterval(interval: ReturnType<typeof setInterval> | null) {
  codePollingInterval = interval;
}

export function setAudioContextFn(fn: (() => AudioContext) | null) {
  getAudioContextFn = fn;
}

export function setSuperdoughFn(
  fn: ((value: Record<string, unknown>, time: number, duration?: number) => Promise<void>) | null
) {
  superdoughFn = fn;
}

export function isAudioContextSuspended(): boolean {
  if (!getAudioContextFn) {
    return false;
  }

  try {
    return getAudioContextFn().state === 'suspended';
  } catch {
    return false;
  }
}

export async function resumeAudioContext(): Promise<boolean> {
  if (!getAudioContextFn) {
    return false;
  }

  try {
    const ctx = getAudioContextFn();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    return ctx.state === 'running';
  } catch (e) {
    console.warn('[strudel] Failed to resume audio context:', e);
    return false;
  }
}

export async function evaluateStrudel() {
  await resumeAudioContext();
  strudelMirrorInstance?.evaluate();
}

export function stopStrudel() {
  strudelMirrorInstance?.stop();
}

export async function previewSample(sampleName: string): Promise<boolean> {
  if (!superdoughFn || !getAudioContextFn) {
    console.warn('[strudel] Audio not initialized yet');
    return false;
  }

  try {
    const ctx = getAudioContextFn();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    await superdoughFn({ s: sampleName }, ctx.currentTime + 0.01);
    return true;
  } catch (error) {
    console.warn('[strudel] Failed to preview sample:', error);
    return false;
  }
}

export function useStrudelEditor(
  initialCode: string,
  onCodeChange: ((code: string) => void) | undefined,
  readOnly: boolean
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const onCodeChangeRef = useRef(onCodeChange);
  const readOnlyRef = useRef(readOnly);

  const { code, setCode, currentStrudelId, setNextUpdateSource } = useEditorStore();
  const { setPlaying, setInitialized, setError } = useAudioStore();
  const wsStatus = useWebSocketStore(state => state.status);
  const sessionStateReceived = useWebSocketStore(state => state.sessionStateReceived);
  const hasReceivedStrudelCode = useRef(false);

  const [urlStrudelId, setUrlStrudelId] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');

    if (id) {
      setUrlStrudelId(id);
    }
  }, []);

  const effectiveStrudelId = currentStrudelId || urlStrudelId;

  if (effectiveStrudelId && sessionStateReceived && !hasReceivedStrudelCode.current) {
    hasReceivedStrudelCode.current = true;
  }

  if (!effectiveStrudelId) {
    hasReceivedStrudelCode.current = false;
  }

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useEffect(() => {
    readOnlyRef.current = readOnly;

    if (strudelMirrorInstance) {
      strudelMirrorInstance.reconfigureExtension?.('isEditable', !readOnly);
    }
  }, [readOnly]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || '';

      if (SUPPRESSED_ERROR_PATTERNS.some(pattern => msg.includes(pattern))) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () =>
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  useEffect(() => {
    if (!strudelMirrorInstance) return;
    const currentCode = strudelMirrorInstance.code || '';
    if (currentCode !== code && code !== undefined) {
      strudelMirrorInstance.setCode(code);
      strudelMirrorInstance.code = code;
    }
  }, [code]);

  const isLoadingStrudel =
    effectiveStrudelId &&
    !hasReceivedStrudelCode.current &&
    (wsStatus === 'connecting' || (wsStatus === 'connected' && !sessionStateReceived));

  return {
    containerRef,
    initializedRef,
    onCodeChangeRef,
    readOnlyRef,
    code,
    setCode,
    setPlaying,
    setInitialized,
    setError,
    isLoadingStrudel,
    initialCode,
  };
}

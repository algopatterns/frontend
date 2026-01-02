"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/stores/editor";
import { useAudioStore } from "@/lib/stores/audio";
import { EDITOR } from "@/lib/constants";

interface StrudelEditorProps {
  initialCode?: string;
  readOnly?: boolean;
  onCodeChange?: (code: string) => void;
}

// Module-level state for Strudel
let strudelMirrorInstance: {
  code?: string;
  setCode: (code: string) => void;
  evaluate: () => Promise<void>;
  stop: () => void;
  destroy: () => void;
} | null = null;

let codePollingInterval: ReturnType<typeof setInterval> | null = null;

export function StrudelEditor({
  initialCode = "",
  readOnly = false,
  onCodeChange,
}: StrudelEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const { code, setCode } = useEditorStore();
  const { setPlaying, setInitialized, setError } = useAudioStore();

  const onCodeChangeRef = useRef(onCodeChange);
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  // Initialize StrudelMirror
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    async function initEditor() {
      try {
        // Dynamic imports for Strudel packages
        const [
          { StrudelMirror },
          { transpiler },
          webaudioModule,
          { registerSoundfonts },
          coreModule,
        ] = await Promise.all([
          import("@strudel/codemirror"),
          import("@strudel/transpiler"),
          import("@strudel/webaudio"),
          import("@strudel/soundfonts"),
          import("@strudel/core"),
        ]);

        const { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds, samples } = webaudioModule;
        const { evalScope, silence } = coreModule;

        if (!containerRef.current) return;

        // Create StrudelMirror instance
        const mirror = new StrudelMirror({
          defaultOutput: webaudioOutput,
          getTime: () => getAudioContext().currentTime,
          transpiler,
          root: containerRef.current,
          initialCode: initialCode || code || EDITOR.DEFAULT_CODE,
          pattern: silence,
          drawTime: [-2, 2],
          autodraw: true,
          bgFill: false,
          prebake: async () => {
            // Initialize audio on first user interaction
            initAudioOnFirstClick(() => {
              getAudioContext();
            });

            // Register all modules in eval scope
            await evalScope(
              import("@strudel/core"),
              import("@strudel/mini"),
              import("@strudel/tonal"),
              import("@strudel/webaudio"),
              import("@strudel/draw"),
            );

            // Register sounds
            await registerSynthSounds();
            await registerSoundfonts();

            // Load samples
            await samples("github:tidalcycles/Dirt-Samples", undefined, { tag: "main" });
          },
          onToggle: (started: boolean) => {
            setPlaying(started);
            if (started) {
              setError(null);
            }
          },
          onError: (error: Error) => {
            console.error("Strudel error:", error);
            setError(error.message);
          },
        });

        // Configure editor appearance
        if (mirror.setFontFamily) mirror.setFontFamily("var(--font-geist-mono), monospace");
        if (mirror.setFontSize) mirror.setFontSize(14);
        if (mirror.setLineNumbers) mirror.setLineNumbers(true);
        if (mirror.setLineWrapping) mirror.setLineWrapping(true);

        // Enable pattern highlighting and flash effects
        if (mirror.reconfigureExtension) {
          mirror.reconfigureExtension("isPatternHighlightingEnabled", true);
          mirror.reconfigureExtension("isFlashEnabled", true);
        }

        strudelMirrorInstance = mirror;
        setInitialized(true);

        // Set initial code in store
        if (initialCode) {
          setCode(initialCode, true);
        }

        // Listen for code changes via polling (StrudelMirror doesn't have onChange)
        codePollingInterval = setInterval(() => {
          if (strudelMirrorInstance) {
            const currentCode = strudelMirrorInstance.code || "";
            const storeCode = useEditorStore.getState().code;
            if (currentCode !== storeCode) {
              setCode(currentCode);
              onCodeChangeRef.current?.(currentCode);
            }
          }
        }, 500);
      } catch (error) {
        console.error("Failed to initialize Strudel:", error);
        setError("Failed to initialize audio engine");
      }
    }

    initEditor();

    return () => {
      if (codePollingInterval) {
        clearInterval(codePollingInterval);
        codePollingInterval = null;
      }
      if (strudelMirrorInstance) {
        strudelMirrorInstance.destroy();
        strudelMirrorInstance = null;
        initializedRef.current = false;
      }
    };
  }, []);

  // Sync external code changes (from WebSocket)
  useEffect(() => {
    if (!strudelMirrorInstance) return;

    const currentCode = strudelMirrorInstance.code || "";
    if (currentCode !== code && code !== undefined) {
      strudelMirrorInstance.setCode(code);
      strudelMirrorInstance.code = code;
    }
  }, [code]);

  return (
    <div
      ref={containerRef}
      className="strudel-editor h-full w-full overflow-hidden rounded-md border"
    />
  );
}

// Export functions to control the editor from outside
export function evaluateStrudel() {
  if (strudelMirrorInstance) {
    strudelMirrorInstance.evaluate();
  }
}

export function stopStrudel() {
  if (strudelMirrorInstance) {
    strudelMirrorInstance.stop();
  }
}

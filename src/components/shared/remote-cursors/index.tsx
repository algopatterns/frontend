'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWebSocketStore, type RemoteCursor } from '@/lib/stores/websocket';
import { getStrudelMirrorInstance } from '@/components/shared/strudel-editor/hooks';
import { getUserColor } from '@/components/shared/chat-message/hooks';

// map Tailwind text colors to hex values for DOM styling
const colorMap: Record<string, string> = {
  'text-rose-400': '#fb7185',
  'text-amber-400': '#fbbf24',
  'text-lime-400': '#a3e635',
  'text-teal-400': '#2dd4bf',
  'text-sky-400': '#38bdf8',
  'text-indigo-400': '#818cf8',
  'text-fuchsia-400': '#e879f9',
  'text-orange-400': '#fb923c',
};

function getHexColor(displayName: string): string {
  const tailwindClass = getUserColor(displayName);
  return colorMap[tailwindClass] || '#ffffff';
}

export function RemoteCursors() {
  const remoteCursors = useWebSocketStore(state => state.remoteCursors);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const updateCursorPositions = useCallback(() => {
    const mirror = getStrudelMirrorInstance();
    if (!mirror?.editor || !containerRef.current) return;

    const editor = mirror.editor;
    const editorRect = editor.dom.getBoundingClientRect();

    // clear existing cursors
    containerRef.current.innerHTML = '';

    remoteCursors.forEach((cursor: RemoteCursor) => {
      try {
        // access the CodeMirror Text document (line() is 1-indexed)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = editor.state.doc as any;
        const totalLines = doc.lines || 1;
        const lineNum = Math.max(1, Math.min(cursor.line, totalLines));
        const line = doc.line(lineNum);

        // calculate the document position (line.from + column, clamped to line end)
        const pos = Math.min(line.from + cursor.col, line.to);

        // get screen coordinates
        const coords = editor.coordsAtPos(pos);
        if (!coords) return;

        const color = getHexColor(cursor.displayName);

        // create cursor element
        const cursorEl = document.createElement('div');
        cursorEl.className = 'remote-cursor';
        cursorEl.style.cssText = `
          position: absolute;
          left: ${coords.left - editorRect.left}px;
          top: ${coords.top - editorRect.top}px;
          width: 2px;
          height: ${coords.bottom - coords.top}px;
          background-color: ${color};
          pointer-events: none;
          z-index: 10;
          animation: cursor-blink 1s infinite;
        `;

        // add name label
        const label = document.createElement('div');
        label.className = 'remote-cursor-label';
        label.textContent = cursor.displayName.split(' ')[0];
        label.style.cssText = `
          position: absolute;
          top: -18px;
          left: 0;
          background-color: ${color};
          color: black;
          font-size: 10px;
          font-weight: 500;
          padding: 1px 4px;
          border-radius: 2px;
          white-space: nowrap;
          opacity: 0.9;
        `;
        cursorEl.appendChild(label);

        containerRef.current?.appendChild(cursorEl);
      } catch {
        // ignore errors from invalid positions
      }
    });
  }, [remoteCursors]);

  // update cursor positions when cursors change or on scroll
  useEffect(() => {
    updateCursorPositions();

    const mirror = getStrudelMirrorInstance();
    if (!mirror?.editor) return;

    const scrollDom = mirror.editor.scrollDOM;

    const handleScroll = () => {
      // use requestAnimationFrame for smooth updates
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateCursorPositions);
    };

    scrollDom.addEventListener('scroll', handleScroll);

    return () => {
      scrollDom.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateCursorPositions]);

  // also update on window resize
  useEffect(() => {
    const handleResize = () => {
      updateCursorPositions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCursorPositions]);

  // stale cursor cleanup - remove cursors not updated in 5+ seconds
  useEffect(() => {
    const STALE_THRESHOLD_MS = 5000;

    const interval = setInterval(() => {
      const { remoteCursors, removeRemoteCursor } = useWebSocketStore.getState();
      const now = Date.now();

      remoteCursors.forEach((cursor, participantId) => {
        if (now - cursor.lastUpdated > STALE_THRESHOLD_MS) {
          removeRemoteCursor(participantId);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.5; }
        }
      `}</style>
      <div
        ref={containerRef}
        className="remote-cursors-container absolute inset-0 overflow-hidden pointer-events-none"
      />
    </>
  );
}

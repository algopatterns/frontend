'use client';

import { Component, type ReactNode } from 'react';
import { useAudioStore } from '@/lib/stores/audio';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: false }; // don't render fallback, just catch the error
  }

  componentDidCatch(error: Error) {
    // add error to toast system
    useAudioStore.getState().addEditorToast({
      type: 'error',
      message: error.message || 'An error occurred',
    });
  }

  render() {
    return this.props.children;
  }
}

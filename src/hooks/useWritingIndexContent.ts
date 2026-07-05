import { useCallback, useEffect, useReducer, useState } from 'react';
import {
  DEFAULT_WRITING_INDEX_CONTENT,
  fetchWritingIndexContent,
  type WritingIndexContent,
} from '../lib/writingIndexContent';

type State = {
  content: WritingIndexContent;
  ready: boolean;
};

type Action = { type: 'success'; content: WritingIndexContent };

function reducer(_state: State, action: Action): State {
  return { content: action.content, ready: true };
}

export function useWritingIndexContent() {
  const [state, dispatch] = useReducer(reducer, {
    content: DEFAULT_WRITING_INDEX_CONTENT,
    ready: false,
  });
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    void fetchWritingIndexContent().then((content) => {
      if (!cancelled) dispatch({ type: 'success', content });
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    const onUpdated = () => reload();
    window.addEventListener('writing-index-content-updated', onUpdated);
    return () => window.removeEventListener('writing-index-content-updated', onUpdated);
  }, [reload]);

  return {
    content: state.content,
    ready: state.ready,
    reload,
  };
}

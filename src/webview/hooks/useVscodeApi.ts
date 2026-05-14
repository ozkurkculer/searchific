import { useRef, useEffect, useCallback } from 'react';
import type { WebviewMessage, HostMessage } from '../../shared/messages';

declare function acquireVsCodeApi(): {
  postMessage: (msg: WebviewMessage) => void;
  getState: <T>() => T | undefined;
  setState: <T>(state: T) => void;
};

const vscodeApi = acquireVsCodeApi();

export function useVscodeApi(onMessage: (msg: HostMessage) => void) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    const handler = (event: MessageEvent<HostMessage>) => {
      handlerRef.current(event.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const post = useCallback((msg: WebviewMessage) => {
    vscodeApi.postMessage(msg);
  }, []);

  return { post };
}

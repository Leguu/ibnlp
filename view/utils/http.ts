import axios from 'axios';
import { useCallback } from 'react';
import { AppToaster } from './toaster';

const apiPath = '/api';

interface Options<T> {
  handleErrors?: boolean;
  onSuccess?: (body: T) => void;
  onError?: () => void;
}

export const useRequests = () => {
  const handleErrors = async (e: any) => {
    console.error(e);
    if (e.response) {
      AppToaster?.show({
        message: e.response.data,
        intent: 'danger',
        icon: 'error'
      });
    } else if (e instanceof Response) {
      const text = await e.text();

      AppToaster?.show({
        message: text,
        intent: 'danger',
        icon: 'error'
      });
    }
  };

  const get = useCallback(<T>(url: string, options?: Options<T>) =>
    axios.get<T>(`${apiPath}${url}`)
      .then(r => {
        options?.onSuccess?.(r.data);
      })
      .catch(e => {
        if (options?.handleErrors !== false) {
          handleErrors(e);
        }
        options?.onError?.();
      }),
    []
  );

  const post = useCallback(<T>(url: string, data: any, options?: Options<T>) =>
    axios.post<T>(`${apiPath}${url}`, data)
      .then(r => {
        options?.onSuccess?.(r?.data);
      })
      .catch(e => {
        if (options?.handleErrors !== false) {
          handleErrors(e);
        }
        options?.onError?.();
      }),
    []
  );

  const stream = useCallback(async function* (url: string, data: any, options?: Options<string>) {
    const response = await fetch(`${apiPath}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });

    if (response.status !== 200) {
      if (options?.handleErrors !== false) {
        handleErrors(response);
      }
      options?.onError?.();
      return;
    }

    const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
    if (!reader) return;

    let text = '';

    while (true) {
      let { done, value } = await reader.read();
      if (done || value === undefined) break;

      const values = value
        .split('\n\n')
        .map(s => s.trim())
        .map(v => v.replaceAll(/data: (.*)/g, '$1'))
        .filter(v => v.length > 0)
        .map(v => JSON.parse(v));

      value = values.join('');

      if (!value) continue;

      text += value;
      yield value;
    }

    options?.onSuccess?.(text);
  }, []);

  return { get, post, stream };
};
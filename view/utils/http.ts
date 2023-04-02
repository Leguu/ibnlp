import axios, { AxiosResponse } from 'axios';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { AppToaster } from './toaster';

const apiPath = '/api';

interface Options<T> {
  handleErrors?: boolean;
  onSuccess?: (body: T) => void;
  onError?: () => void;
}

export const useRequests = () => {
  const handleErrors = (e: any) => {
    AppToaster?.show({
      message: e.response.data,
      intent: 'danger',
      icon: 'error'
    });
  };

  const get = useCallback(<T>(url: string, options?: Options<T>) =>
    axios.get<T>(`${apiPath}${url}`)
      .then(r => options?.onSuccess?.(r.data))
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
      .then(r => options?.onSuccess?.(r?.data))
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
      const { done, value } = await reader.read();
      if (done || value === undefined) break;

      if (value.includes("data: [DONE]")) break;

      const values = value.split("\n")
        .filter(v => v.startsWith("data: "))
        .map(v => v.replace(/^data: "(.*)"$/, '$1'));

      const joined = values.join('');

      text += joined;
      yield joined;
    }

    options?.onSuccess?.(text);
  }, []);

  return { get, post, stream };
};
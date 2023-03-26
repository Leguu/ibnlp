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

  return { get, post };
};
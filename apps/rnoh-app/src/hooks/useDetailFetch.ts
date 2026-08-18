import {useEffect, useState, useCallback} from 'react';
import type {ApiResponse} from '@/types/common.types';
interface UseParamsDetailFetchOptions<T> {
  fetcher: (params: Record<string, unknown>) => Promise<ApiResponse<T>>;
  params: Record<string, unknown>;
}

interface UseDetailFetchOptions<T> {
  fetcher: (params: Record<string, unknown>) => Promise<ApiResponse<T>>;
  id: string;
}

/** 详情接口为 { data: { data: T } } 时的外层 data 载荷 */
interface UseOrderDetailFetchOptions<T> {
  fetcher: (
    params: Record<string, unknown>,
  ) => Promise<ApiResponse<{data: T; returnList: any[]; backInfo: any[]}>>;
  id: string;
}

export function useParamsDetailFetch<T>({
  fetcher,
  params,
}: UseParamsDetailFetchOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher(params);

      if (res.code === 200) {
        setData(res.data as T);
      } else {
        setError(res.message || '请求失败');
      }
    } catch (e: any) {
      setError(e?.message || '网络错误');
    } finally {
      setLoading(false);
    }
  }, [fetcher, params]);

  useEffect(() => {
    if (Object.keys(params).length > 0) {
      fetchData();
    }
  }, [fetchData, params]);

  return {data, loading, error, refresh: fetchData};
}

export function useDetailFetch<T>({fetcher, id}: UseDetailFetchOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher({id});
      if (res.code === 200) {
        setData(res.data as T);
      } else {
        setError(res.message || '请求失败');
      }
    } catch (e: any) {
      setError(e?.message || '网络错误');
    } finally {
      setLoading(false);
    }
  }, [fetcher, id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [fetchData, id]);

  return {data, loading, error, refresh: fetchData};
}

export function useOrderDetailFetch<T>({
  fetcher,
  id,
}: UseOrderDetailFetchOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [returnList, setReturnList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backInfo, setBackInfo] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher({id});
      if (res.code === 200) {
        setData(res.data.data as T);
        setReturnList(res.data.returnList || []);
        setBackInfo(res.data.backInfo[0] || null);
      } else {
        setError(res.message || '请求失败');
      }
    } catch (e: any) {
      setError(e?.message || '网络错误');
    } finally {
      setLoading(false);
    }
  }, [fetcher, id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [fetchData, id]);

  return {data, loading, error, returnList, backInfo, refresh: fetchData};
}

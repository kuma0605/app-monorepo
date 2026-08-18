import {API_BASE_URL, API_TIMEOUT} from '../constants/apiConfig';
import type {ApiResponse} from '../types/common.types';
import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

// ─── 错误类型 ──────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = '网络连接失败，请检查网络设置') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`请求超时（${timeout / 1000}s），请稍后重试`);
    this.name = 'TimeoutError';
  }
}

// ─── 请求配置 ──────────────────────────────────────────────────────────────────

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  params?: Record<string, unknown>;
  onUploadProgress?: (progressEvent: any) => void;
  /**
   * 跳过全局 Loading（用于静默刷新、轮询等）
   * - 也可通过 headers 传入 'x-no-loading': 'true'
   */
  noLoading?: boolean;
}

// ─── Token 注入接口（由外部 auth 模块实现） ────────────────────────────────────

type TokenProvider = () => string | null;

let _tokenProvider: TokenProvider = () => null;

export function setTokenProvider(provider: TokenProvider) {
  _tokenProvider = provider;
}

// ─── 全局 Loading（由外部 UI/Store 注入） ───────────────────────────────────────

type GlobalLoadingHandler = (isLoading: boolean) => void;

let _globalLoadingHandler: GlobalLoadingHandler = () => {};

export function setGlobalLoadingHandler(handler: GlobalLoadingHandler) {
  _globalLoadingHandler = handler;
}

// ─── 授权失效处理（由外部 UI/Store 注入） ──────────────────────────────────────

type UnauthorizedHandler = () => void;

let _unauthorizedHandler: UnauthorizedHandler = () => {};

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  _unauthorizedHandler = handler;
}

let requestCount = 0;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let lastShownAt = 0;

const SHOW_DELAY_MS = 0;
const MIN_VISIBLE_MS = 200;

function shouldUseGlobalLoading(config: {
  headers?: unknown;
  noLoading?: boolean;
}) {
  // 默认开启的原因：
  // - 大多数请求不会显式设置 noLoading / x-no-loading
  // - 此时 headerNoLoading 和 config.noLoading 都是 undefined/false
  // - 返回 !(false || false) = true，即“默认参与全局 Loading”
  const headerNoLoading = (config.headers as any)?.['x-no-loading'];
  return !(headerNoLoading || config.noLoading);
}

function showGlobalLoading() {
  if (requestCount === 0 && !showTimer) {
    // 如果上一轮“延迟关闭”还在排队，新请求开始时要取消，否则可能误关新一轮 loading
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
      // 此时 Loading 已经是显示状态，更新时间并直接增加计数，不需要重新设置 showTimer 延迟
      lastShownAt = Date.now();
      requestCount += 1;
      return;
    }

    if (SHOW_DELAY_MS <= 0) {
      lastShownAt = Date.now();
      _globalLoadingHandler(true);
    } else {
      showTimer = setTimeout(() => {
        showTimer = null;
        if (requestCount > 0) {
          lastShownAt = Date.now();
          _globalLoadingHandler(true);
        }
      }, SHOW_DELAY_MS);
    }
  }
  requestCount += 1;
}

function hideGlobalLoading() {
  requestCount -= 1;
  if (requestCount <= 0) {
    requestCount = 0;

    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
      return;
    }

    const elapsed = Date.now() - lastShownAt;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    if (remaining > 0) {
      // 避免竞态：如果 remaining 期间又来了新请求，showGlobalLoading() 会取消 hideTimer
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      hideTimer = setTimeout(() => {
        hideTimer = null;
        // 二次检查：只有在确实没有进行中的请求时才关闭
        if (requestCount === 0) {
          _globalLoadingHandler(false);
        }
      }, remaining);
    } else {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      _globalLoadingHandler(false);
    }
  }
}

// ─── 开发环境请求日志 ──────────────────────────────────────────────────────────

const requestStartTimes = new WeakMap<object, number>();
const SENSITIVE_KEYS = [
  'authorization',
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
];

function redactSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(
      ([key, nestedValue]) => [
        key,
        SENSITIVE_KEYS.includes(key.toLowerCase())
          ? '[REDACTED]'
          : redactSensitiveData(nestedValue),
      ],
    ),
  );
}

function getRequestLabel(config: AxiosRequestConfig) {
  const method = config.method?.toUpperCase() ?? 'GET';
  const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
  return {method, url};
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function logRequest(config: AxiosRequestConfig) {
  if (!__DEV__) {
    return;
  }

  const {method, url} = getRequestLabel(config);
  console.log('[API Request]', {
    method,
    url,
    params: redactSensitiveData(config.params),
    data: redactSensitiveData(config.data),
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function logResponse(response: AxiosResponse) {
  if (!__DEV__) {
    return;
  }

  const {method, url} = getRequestLabel(response.config);
  const startedAt = requestStartTimes.get(response.config);
  const durationMs = startedAt ? Date.now() - startedAt : undefined;
  console.log('[API Response]', {
    method,
    url,
    status: response.status,
    durationMs,
    data: redactSensitiveData(response.data),
  });
}

function logError(error: AxiosError) {
  if (!__DEV__) {
    return;
  }

  const config = error.config;
  const {method, url} = config
    ? getRequestLabel(config)
    : {method: 'UNKNOWN', url: 'UNKNOWN'};
  const startedAt = config ? requestStartTimes.get(config) : undefined;
  const durationMs = startedAt ? Date.now() - startedAt : undefined;
  console.log('[API Error]', {
    method,
    url,
    status: error.response?.status,
    durationMs,
    message: error.message,
    data: redactSensitiveData(error.response?.data),
  });
}

// ─── Axios 实例 ────────────────────────────────────────────────────────────────

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(config => {
  requestStartTimes.set(config, Date.now());

  const headers = AxiosHeaders.from(config.headers);

  const token = _tokenProvider();
  if (token) {
    headers.set('Authorization', token);
  }

  // axios 1.x 默认 Content-Type: application/json；若未正确清除，
  // transformRequest 会把 FormData 转成 JSON 字符串，Android 上常表现为 Network Error。
  // setContentType(false) 让 RN 原生层自动生成 multipart boundary。
  if (config.data instanceof FormData) {
    headers.setContentType(false);
  }

  config.headers = headers;

  // Loading 的 show/hide 由 request() 的 try/finally 统一兜底，
  // 避免 error 被转换成自定义异常（NetworkError 等）后，某些路径漏掉 hide。
  // logRequest(config);
  return config;
});

axiosClient.interceptors.response.use(
  response => {
    // logResponse(response);
    // 拦截业务状态码
    const {code} = (response.data as any) || {};
    /**
     * 401: Unauthorized - 身份验证失效（Token 过期或无效）
     * 此时需要触发全局的登出逻辑，引导用户重新登录
     */
    if (code === 401) {
      _unauthorizedHandler();
    } else if (code === 403) {
      /**
       * 403: Forbidden - 服务器拒绝访问（权限不足）
       * 用户已登录，但当前账号没有操作该接口的权限
       */
      // 通常只需提示权限不足，不一定需要强制登出
      // TODO: 可根据需求在此处增加全局 Toast 提示
      // 暂时用登出
      _unauthorizedHandler();
    }
    return response;
  },
  (error: AxiosError) => {
    logError(error);
    const status = error.response?.status;
    /**
     * HTTP 401: 身份验证失败，强制登出
     */
    if (status === 401) {
      _unauthorizedHandler();
    } else if (status === 403) {
      /**
       * HTTP 403: 权限不足，拒绝执行
       */
      // 仅提示即可
      // 暂时用登出
      _unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

// ─── 核心请求函数 ──────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  config: RequestConfig = {},
): Promise<ApiResponse<T>> {
  const usesGlobalLoading = shouldUseGlobalLoading({
    headers: config.headers,
    noLoading: config.noLoading,
  });
  if (usesGlobalLoading) {
    showGlobalLoading();
  }

  try {
    const axiosConfig: AxiosRequestConfig = {
      url: path,
      method: method as AxiosRequestConfig['method'],
      headers: config.headers,
      timeout: config.timeout ?? API_TIMEOUT,
      signal: config.signal,
      params: config.params,
      data: body,
      onUploadProgress: config.onUploadProgress,
    };

    (axiosConfig as AxiosRequestConfig & {noLoading?: boolean}).noLoading =
      config.noLoading;

    const response = await axiosClient.request<ApiResponse<T>>(axiosConfig);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<unknown>;

      if (axiosError.code === 'ECONNABORTED') {
        throw new TimeoutError(config.timeout ?? API_TIMEOUT);
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;
        const message =
          typeof (data as any)?.message === 'string'
            ? (data as any).message
            : axiosError.message || `HTTP ${status}`;
        throw new ApiError(status, message, data);
      }

      throw new NetworkError();
    }

    throw new NetworkError();
  } finally {
    if (usesGlobalLoading) {
      hideGlobalLoading();
    }
  }
}

// ─── 对外暴露的 HTTP 方法 ──────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, config?: RequestConfig) {
    return request<T>('GET', path, undefined, config);
  },

  post<T>(path: string, body: unknown, config?: RequestConfig) {
    return request<T>('POST', path, body, config);
  },

  put<T>(path: string, body: unknown, config?: RequestConfig) {
    return request<T>('PUT', path, body, config);
  },

  patch<T>(path: string, body: unknown, config?: RequestConfig) {
    return request<T>('PATCH', path, body, config);
  },

  delete<T>(path: string, config?: RequestConfig) {
    return request<T>('DELETE', path, undefined, config);
  },
};

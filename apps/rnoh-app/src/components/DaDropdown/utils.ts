import type {DaterangeValue, DropdownFieldAlign, DropdownOption} from './types';

export function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function alignData(
  data: DropdownOption[],
  alignField?: DropdownFieldAlign,
): DropdownOption[] {
  if (!alignField) {
    return data;
  }
  const labelKey = alignField.label ?? 'label';
  const valueKey = alignField.value ?? 'value';
  const childrenKey = alignField.children ?? 'children';

  const walk = (list: DropdownOption[]): DropdownOption[] => {
    return list.map(raw => {
      const r = raw as unknown as Record<string, unknown>;
      const next: DropdownOption = {
        ...raw,
        label: (r[labelKey] as string) ?? raw.label ?? '',
        value: (r[valueKey] as string | number) ?? raw.value ?? '',
        suffix: raw.suffix,
        disabled: raw.disabled,
      };
      const ch = r[childrenKey] as DropdownOption[] | undefined;
      if (Array.isArray(ch) && ch.length) {
        next.children = walk(ch);
      }
      return next;
    });
  };

  return walk(data);
}

/** 个位数补零 */
export function formatNumber(n: number | string): string {
  let s = Number.parseInt(String(n), 10);
  if (Number.isNaN(s)) {
    return '0';
  }
  const str = String(s);
  return str.length > 1 ? str : `0${str}`;
}

/**
 * 格式化时间
 * @param date 时间对象或时间戳（秒级长度小于 11 时按秒处理）
 * @param format 如 y-m-d
 */
export function formatTime(
  date: Date | number | string,
  format?: string,
): string {
  const d =
    typeof date === 'object' && date !== null && 'getFullYear' in date
      ? (date as Date)
      : new Date(String(date).length < 11 ? Number(date) * 1000 : Number(date));
  const formatsRule = ['y', 'm', 'd', 'h', 'i', 's'] as const;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();

  if (format) {
    let fmt = format;
    const tmp = [year, month, day, hour, minute, second].map(formatNumber);
    for (let i = 0; i < tmp.length; i++) {
      fmt = fmt.toLowerCase().replace(formatsRule[i], tmp[i]);
    }
    return fmt;
  }

  return `${[year, month, day].map(formatNumber).join('/')} ${[
    hour,
    minute,
    second,
  ]
    .map(formatNumber)
    .join(':')}`;
}

export interface RangeDateResult {
  start: string;
  end: string;
}

export type DaterangeFormat = 'y-m-d' | 'y-m-d h:i';

export function daterangeFormatOf(
  precision: 'day' | 'minute' = 'day',
): DaterangeFormat {
  return precision === 'minute' ? 'y-m-d h:i' : 'y-m-d';
}

/** 仅日期时补全为当日 00:00 */
export function normalizeDaterangePart(
  value: string,
  format: DaterangeFormat,
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (format === 'y-m-d') {
    return trimmed;
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    return `${trimmed} 00:00`;
  }
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})$/.exec(trimmed);
  if (m) {
    const [, y, mo, d, h, mi] = m;
    return `${y}-${formatNumber(mo)}-${formatNumber(d)} ${formatNumber(
      h,
    )}:${formatNumber(mi)}`;
  }
  return trimmed;
}

export function normalizeDaterangeValue(
  value: DaterangeValue,
  format: DaterangeFormat,
): DaterangeValue {
  return {
    start: normalizeDaterangePart(value.start, format),
    end: normalizeDaterangePart(value.end, format),
  };
}

function formatRangeDate(date: Date, format: DaterangeFormat): string {
  if (format === 'y-m-d h:i') {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return formatTime(d, format);
  }
  return formatTime(date, format);
}

/**
 * 获取某个时间范围（与旧版逻辑一致）
 * @param v -1 昨日；-7 本周；-14 上周；-30 本月；-60 上月；正整数为近 v 天（不含今天）
 */
export function getRangeDate(
  v: string | number,
  format: DaterangeFormat = 'y-m-d',
): RangeDateResult {
  const now = new Date();
  const nowTime = now.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const dateRange: RangeDateResult = {start: '', end: ''};
  const nowWeekDay = now.getDay();
  const nowDay = now.getDate();
  const nowMonth = now.getMonth();
  const nowYear = now.getFullYear();

  const getMonthDays = (month: number): number => {
    const monthStartDate = new Date(nowYear, month, 1);
    const monthEndDate = new Date(nowYear, month + 1, 1);
    return (monthEndDate.getTime() - monthStartDate.getTime()) / oneDay;
  };

  const vStr = String(v);

  if (vStr === '-1') {
    dateRange.start = formatRangeDate(new Date(nowTime - oneDay), format);
    dateRange.end = dateRange.start;
  } else if (vStr === '-7') {
    const weekStart = new Date(nowYear, nowMonth, nowDay - nowWeekDay + 1);
    const weekEnd = new Date(nowTime + oneDay);
    dateRange.start = formatRangeDate(weekStart, format);
    dateRange.end = formatRangeDate(weekEnd, format);
  } else if (vStr === '-14') {
    const weekStart = new Date(nowYear, nowMonth, nowDay - nowWeekDay - 6);
    const weekEnd = new Date(nowYear, nowMonth, nowDay - nowWeekDay);
    dateRange.start = formatRangeDate(weekStart, format);
    dateRange.end = formatRangeDate(weekEnd, format);
  } else if (vStr === '-30') {
    const monthStart = new Date(nowYear, nowMonth, 1);
    const monthEnd = new Date(nowTime + oneDay);
    dateRange.start = formatRangeDate(monthStart, format);
    dateRange.end = formatRangeDate(monthEnd, format);
  } else if (vStr === '-60') {
    const today = new Date();
    let lastMonthYear = today.getFullYear();
    let lastMonth = today.getMonth() - 1;
    if (lastMonth < 0) {
      lastMonthYear -= 1;
      lastMonth += 12;
    }
    const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
    const lastMonthEnd = new Date(
      lastMonthYear,
      lastMonth,
      getMonthDays(lastMonth),
    );
    dateRange.start = formatRangeDate(lastMonthStart, format);
    dateRange.end = formatRangeDate(lastMonthEnd, format);
  } else if (Number(v) > 0) {
    const days = Number.parseInt(String(v), 10);
    dateRange.start = formatRangeDate(
      new Date(nowTime - oneDay * days),
      format,
    );
    dateRange.end = formatRangeDate(new Date(nowTime - oneDay), format);
  }

  return dateRange;
}

/** 将 yyyy-MM-dd 解析为本地 Date（无效则返回 undefined） */
export function parseYmdToDate(ymd: string): Date | undefined {
  return parseDaterangeToDate(ymd, 'day');
}

/** 解析日期范围字符串（支持 yyyy-MM-dd 或 yyyy-MM-dd HH:mm） */
export function parseDaterangeToDate(
  value: string,
  precision: 'day' | 'minute' = 'day',
): Date | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (precision === 'day') {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (!m) {
      return undefined;
    }
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const day = Number(m[3]);
    const dt = new Date(y, mo, day);
    return Number.isNaN(dt.getTime()) ? undefined : dt;
  }

  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?$/.exec(
    trimmed,
  );
  if (!m) {
    return undefined;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = m[4] !== undefined ? Number(m[4]) : 0;
  const minute = m[5] !== undefined ? Number(m[5]) : 0;
  const dt = new Date(y, mo, day, hour, minute, 0, 0);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

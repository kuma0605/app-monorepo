import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {StyleSheet, View, TouchableOpacity, Text} from 'react-native';
import {DatePicker, Toast} from '@ant-design/react-native';
import type {
  DaterangeMenuItem,
  DaterangePrecision,
  DaterangeTagItem,
  DaterangeValue,
} from './types';
import {
  deepClone,
  daterangeFormatOf,
  formatTime,
  getRangeDate,
  normalizeDaterangeValue,
  parseDaterangeToDate,
} from './utils';
import {PartDropdownFooter} from './PartDropdownFooter';

const DEFAULT_TAGS: DaterangeTagItem[] = [
  {value: '-7', label: '本周'},
  {value: '-14', label: '上周'},
  {value: '-30', label: '本月'},
  {value: '-60', label: '上月'},
  {value: '7', label: '近7天'},
  {value: '15', label: '近15天'},
  {value: '30', label: '近30天'},
];

export interface DropdownDaterangeProps {
  dropdownItem: DaterangeMenuItem;
  dropdownIndex: number;
  themeColor: string;
  textColor: string;
  onSuccess: (
    payload: Record<string, unknown>,
    range: DaterangeValue | null,
    index: number,
  ) => void;
  onReset: (
    payload: Record<string, unknown>,
    range: DaterangeValue | null,
    index: number,
  ) => void;
}

function emptyRange(): DaterangeValue {
  return {start: '', end: ''};
}

export const DropdownDaterange = memo(function DropdownDaterange({
  dropdownItem,
  dropdownIndex,
  themeColor,
  textColor,
  onSuccess,
  onReset,
}: DropdownDaterangeProps) {
  const precision: DaterangePrecision = dropdownItem.precision ?? 'day';
  const valueFormat = daterangeFormatOf(precision);
  const pickerPrecision = precision === 'minute' ? 'minute' : 'day';

  const [daterange, setDaterange] = useState<DaterangeValue>(emptyRange());
  const [datetag, setDatetag] = useState('');

  const tags = dropdownItem.dateTagList?.length
    ? dropdownItem.dateTagList
    : DEFAULT_TAGS;

  useEffect(() => {
    const v = dropdownItem.value;
    if (v?.start || v?.end) {
      setDaterange(
        normalizeDaterangeValue(
          {
            start: v.start || '',
            end: v.end || '',
          },
          valueFormat,
        ),
      );
      setDatetag('');
    } else {
      setDaterange(emptyRange());
      setDatetag('');
    }
  }, [dropdownItem.value, valueFormat]);

  const formatSelected = useCallback(
    (d: Date) => formatTime(d, valueFormat),
    [valueFormat],
  );

  const handleStartChange = useCallback(
    (d: Date) => {
      setDaterange({
        start: formatSelected(d),
        end: '',
      });
      setDatetag('');
    },
    [formatSelected],
  );

  const handleEndChange = useCallback(
    (d: Date) => {
      setDaterange(prev => ({
        ...prev,
        end: formatSelected(d),
      }));
      setDatetag('');
    },
    [formatSelected],
  );

  const handleTagDate = useCallback(
    (code: string) => {
      setDaterange(getRangeDate(code, valueFormat));
      setDatetag(code);
    },
    [valueFormat],
  );

  const handleReset = useCallback(() => {
    setDaterange(emptyRange());
    setDatetag('');
    if (dropdownItem.prop) {
      onReset({[dropdownItem.prop]: null}, null, dropdownIndex);
    }
  }, [dropdownIndex, dropdownItem.prop, onReset]);

  const handleConfirm = useCallback(() => {
    if (daterange.start && daterange.start !== '') {
      if (!daterange.end || daterange.end === '') {
        Toast.info('请选择结束时间', 1.5);
        return;
      }
    }
    if (!dropdownItem.prop) {
      console.error(`菜单项${dropdownItem.title}未定义prop，返回内容失败`);
      return;
    }
    const normalized = normalizeDaterangeValue(daterange, valueFormat);
    const value =
      normalized.start && normalized.end ? deepClone(normalized) : null;
    const res: Record<string, unknown> = {
      [dropdownItem.prop]: value,
    };
    onSuccess(res, value, dropdownIndex);
  }, [
    daterange,
    dropdownIndex,
    dropdownItem.prop,
    dropdownItem.title,
    onSuccess,
    valueFormat,
  ]);

  const startDate = useMemo(
    () => parseDaterangeToDate(daterange.start, precision) ?? new Date(),
    [daterange.start, precision],
  );
  const endDate = useMemo(
    () =>
      parseDaterangeToDate(daterange.end, precision) ??
      parseDaterangeToDate(daterange.start, precision) ??
      new Date(),
    [daterange.end, daterange.start, precision],
  );
  const minEndDate = useMemo(
    () => parseDaterangeToDate(daterange.start, precision),
    [daterange.start, precision],
  );

  const activeText = useMemo(
    () => StyleSheet.create({t: {color: themeColor}}),
    [themeColor],
  );

  const tagActiveBg = useMemo(
    () =>
      StyleSheet.create({
        wrap: {backgroundColor: '#ffffff'},
        mask: {backgroundColor: themeColor},
      }),
    [themeColor],
  );

  const dateTextStyle = useMemo(
    () => [
      styles.dateText,
      precision === 'minute' ? styles.dateTextMinute : null,
    ],
    [precision],
  );

  return (
    <View style={styles.box}>
      <View style={styles.rowBar}>
        <DatePicker
          value={startDate}
          precision={pickerPrecision}
          onChange={handleStartChange}>
          <TouchableOpacity style={styles.dateCell} activeOpacity={0.85}>
            <Text
              style={[
                dateTextStyle,
                {color: textColor},
                daterange.start ? activeText.t : null,
              ]}
              numberOfLines={1}>
              {daterange.start || '开始时间'}
            </Text>
          </TouchableOpacity>
        </DatePicker>
        <Text style={styles.sep}>至</Text>
        <DatePicker
          value={endDate}
          precision={pickerPrecision}
          minDate={daterange.start ? minEndDate : undefined}
          onChange={handleEndChange}>
          <TouchableOpacity
            style={[
              styles.dateCell,
              !daterange.start ? styles.dateDisabled : null,
            ]}
            activeOpacity={0.85}
            disabled={!daterange.start}>
            <Text
              style={[
                dateTextStyle,
                {color: textColor},
                daterange.end ? activeText.t : null,
              ]}
              numberOfLines={1}>
              {daterange.end || '结束时间'}
            </Text>
          </TouchableOpacity>
        </DatePicker>
      </View>

      <View style={styles.tagsRow}>
        {tags.map(tag => {
          const on = datetag === tag.value;
          return (
            <TouchableOpacity
              key={tag.value}
              style={[styles.tag, on ? tagActiveBg.wrap : null]}
              activeOpacity={0.85}
              onPress={() => handleTagDate(tag.value)}>
              {on ? <View style={[styles.tagMask, tagActiveBg.mask]} /> : null}
              <Text
                style={[
                  styles.tagText,
                  {color: textColor},
                  on ? activeText.t : null,
                ]}>
                {tag.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <PartDropdownFooter
        resetText={dropdownItem.resetText}
        confirmText={dropdownItem.confirmText}
        themeColor={themeColor}
        onReset={handleReset}
        onConfirm={handleConfirm}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    width: '100%',
  },
  rowBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 999,
  },
  dateCell: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dateDisabled: {
    opacity: 0.45,
  },
  dateText: {
    fontSize: 15,
  },
  dateTextMinute: {
    fontSize: 13,
  },
  sep: {
    paddingHorizontal: 6,
    fontSize: 15,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tag: {
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 22,
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderRadius: 999,
  },
  tagText: {
    fontSize: 16,
    zIndex: 1,
  },
  tagMask: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    zIndex: 0,
  },
});

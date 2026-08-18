import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import dayjs from 'dayjs';
import {Calendar} from 'rn-cross-calendar';
import type {DateRange} from 'rn-cross-calendar';
import {useTheme} from '@/hooks/useTheme';
import {Icon, Modal} from '@ant-design/react-native';

/**
 * Calendar 组件演示页。
 *
 * 场景：
 * 1. 基础单选
 * 2. minDate / maxDate 禁用过去 30 天之前与未来 30 天之后
 * 3. dot 标记 + 自定义主题色
 * 4. 范围选择
 */
export default function CalendarDemoScreen() {
  const {colors, spacing, borderRadius, typography} = useTheme();

  // 1. 基础单选
  const [picked, setPicked] = useState<string | undefined>(undefined);

  // 2. min/maxDate 演示用：今天 ±30 天
  const [pickedInRange, setPickedInRange] = useState<string | undefined>(
    dayjs().format('YYYY-MM-DD'),
  );
  const minDate = useMemo(
    () => dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    [],
  );
  const maxDate = useMemo(
    () => dayjs().add(30, 'day').format('YYYY-MM-DD'),
    [],
  );

  // 3. dot 标记 + 主题色
  const [pickedWithDot, setPickedWithDot] = useState<string | undefined>(
    undefined,
  );

  // 4. 范围选择
  const [pickedRange, setPickedRange] = useState<DateRange>([
    undefined,
    undefined,
  ]);

  // 5. 抽屉日历选择
  const [pickedDrawerDate, setPickedDrawerDate] = useState<string | undefined>(
    undefined,
  );
  const [tempSelectedDate, setTempSelectedDate] = useState<string | undefined>(
    undefined,
  );
  const [panelDate, setPanelDate] = useState<string | undefined>(undefined);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const calendarRef = useRef<any>(null);

  const handleOpenDrawer = useCallback(() => {
    setTempSelectedDate(pickedDrawerDate);
    setPanelDate(pickedDrawerDate ?? dayjs().format('YYYY-MM-DD'));
    setDrawerVisible(true);
  }, [pickedDrawerDate]);

  const handleConfirm = useCallback(() => {
    if (!tempSelectedDate) {
      calendarRef.current?.shakeToday();
      return;
    }
    setPickedDrawerDate(tempSelectedDate);
    setDrawerVisible(false);
  }, [tempSelectedDate]);
  // 假设当前月份每周三和周六都有"事件"
  const getDateMark = useCallback(
    (d: string) => {
      const wd = dayjs(d).day();
      if (wd === 3) {
        return colors.warning;
      }
      if (wd === 6) {
        return colors.success;
      }
      return false;
    },
    [colors.warning, colors.success],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {flex: 1, backgroundColor: colors.background},
        content: {
          padding: spacing.md,
          paddingBottom: spacing.xxl,
        },
        section: {
          marginBottom: spacing.lg,
        },
        sectionTitle: {
          ...typography.h4,
          color: colors.text,
          marginBottom: spacing.xs,
        },
        sectionHint: {
          ...typography.caption,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        },
        valueBar: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        valueLabel: {
          ...typography.body2,
          color: colors.textSecondary,
          marginRight: spacing.sm,
        },
        valueText: {
          ...typography.body1,
          color: colors.text,
          flex: 1,
        },
        resetBtn: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
        resetBtnText: {
          ...typography.body2,
          color: colors.primary,
        },
        calendarWrap: {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
        },
        legendRow: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: spacing.xs,
        },
        legendItem: {
          flexDirection: 'row',
          alignItems: 'center',
          marginRight: spacing.md,
        },
        legendDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          marginRight: 4,
        },
        legendText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        inputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          justifyContent: 'space-between',
        },
        inputContent: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        inputText: {
          ...typography.body1,
          color: colors.text,
          marginLeft: spacing.sm,
        },
        inputPlaceholder: {
          ...typography.body1,
          color: colors.textSecondary,
          marginLeft: spacing.sm,
        },
        clearIconContainer: {
          padding: spacing.xs,
        },
        calendarDrawer: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          paddingBottom: 20,
        },
        calendarDrawerHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          height: 54,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        drawerHeaderLeft: {
          width: 60,
          alignItems: 'flex-start',
        },
        calendarDrawerTitle: {
          flex: 1,
          textAlign: 'center',
          ...typography.h4,
          fontWeight: '600',
          color: colors.text,
        },
        drawerHeaderRight: {
          width: 60,
          alignItems: 'flex-end',
        },
        drawerHeaderConfirmText: {
          fontSize: 15,
          color: colors.primary,
          fontWeight: '500',
        },
      }),
    [colors, spacing, borderRadius, typography],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* 1. 基础单选 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 基础单选</Text>
        <Text style={styles.sectionHint}>
          点击日期切换选中；点击标题可切换到年视图快速换月。
        </Text>
        <View style={styles.valueBar}>
          <Text style={styles.valueLabel}>当前选中：</Text>
          <Text style={styles.valueText}>{picked ?? '（未选）'}</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            activeOpacity={0.6}
            onPress={() => setPicked(undefined)}>
            <Text style={styles.resetBtnText}>清空</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.calendarWrap}>
          <Calendar value={picked} onChange={setPicked} />
        </View>
      </View>

      {/* 2. min/maxDate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. minDate / maxDate</Text>
        <Text style={styles.sectionHint}>
          可选范围：{minDate} ~ {maxDate}（今天 ±30 天）
        </Text>
        <View style={styles.valueBar}>
          <Text style={styles.valueLabel}>当前选中：</Text>
          <Text style={styles.valueText}>{pickedInRange ?? '（未选）'}</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            activeOpacity={0.6}
            onPress={() => setPickedInRange(dayjs().format('YYYY-MM-DD'))}>
            <Text style={styles.resetBtnText}>回到今天</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.calendarWrap}>
          <Calendar
            value={pickedInRange}
            onChange={setPickedInRange}
            minDate={minDate}
            maxDate={maxDate}
          />
        </View>
      </View>

      {/* 3. dot 标记 + 自定义主题色 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. dot 标记 + 自定义主题色</Text>
        <Text style={styles.sectionHint}>
          通过 getDateMark 给特定日期加底部色点；themeColor 改选中色。
        </Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, {backgroundColor: colors.warning}]}
            />
            <Text style={styles.legendText}>周三</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, {backgroundColor: colors.success}]}
            />
            <Text style={styles.legendText}>周六</Text>
          </View>
        </View>
        <View style={styles.valueBar}>
          <Text style={styles.valueLabel}>当前选中：</Text>
          <Text style={styles.valueText}>{pickedWithDot ?? '（未选）'}</Text>
        </View>
        <View style={styles.calendarWrap}>
          <Calendar
            value={pickedWithDot}
            onChange={setPickedWithDot}
            themeColor={colors.secondary}
            getDateMark={getDateMark}
          />
        </View>
      </View>

      {/* 4. 范围选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 范围选择</Text>
        <Text style={styles.sectionHint}>
          第一次点击设起始日期，第二次点击设结束日期；点击同一天清空。
        </Text>
        <View style={styles.valueBar}>
          <Text style={styles.valueLabel}>当前选中：</Text>
          <Text style={styles.valueText}>
            {pickedRange[0] && pickedRange[1]
              ? `${pickedRange[0]}  ~  ${pickedRange[1]}`
              : pickedRange[0]
              ? `${pickedRange[0]}  ~  （请选择结束日期）`
              : '（未选）'}
          </Text>
          <TouchableOpacity
            style={styles.resetBtn}
            activeOpacity={0.6}
            onPress={() => setPickedRange([undefined, undefined])}>
            <Text style={styles.resetBtnText}>清空</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.calendarWrap}>
          <Calendar
            mode="range"
            value={pickedRange}
            onChange={setPickedRange}
          />
        </View>
      </View>

      {/* 5. 抽屉日历选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. 抽屉日历选择</Text>
        <Text style={styles.sectionHint}>
          点击下方输入框唤起底部抽屉进行日期选择。
        </Text>
        <TouchableOpacity
          style={styles.inputContainer}
          activeOpacity={0.7}
          onPress={handleOpenDrawer}>
          <View style={styles.inputContent}>
            <Icon name="calendar" size={20} color={colors.textSecondary} />
            {pickedDrawerDate ? (
              <Text style={styles.inputText}>{pickedDrawerDate}</Text>
            ) : (
              <Text style={styles.inputPlaceholder}>请选择日期</Text>
            )}
          </View>
          {pickedDrawerDate ? (
            <TouchableOpacity
              style={styles.clearIconContainer}
              activeOpacity={0.6}
              onPress={() => {
                setPickedDrawerDate(undefined);
                setTempSelectedDate(undefined);
              }}>
              <Icon name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <Icon name="down" size={14} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* 抽屉 Modal */}
      <Modal
        popup
        visible={drawerVisible}
        animationType="slide-up"
        maskClosable
        onClose={() => setDrawerVisible(false)}>
        <View style={styles.calendarDrawer}>
          <View style={styles.calendarDrawerHeader}>
            <TouchableOpacity
              onPress={() => setDrawerVisible(false)}
              style={styles.drawerHeaderLeft}>
              <Icon name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.calendarDrawerTitle}>选择日期</Text>
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.drawerHeaderRight}>
              <Text style={styles.drawerHeaderConfirmText}>确认</Text>
            </TouchableOpacity>
          </View>
          <Calendar
            ref={calendarRef}
            mode="single"
            value={tempSelectedDate}
            onChange={setTempSelectedDate}
            panelDate={panelDate}
            onPanelChange={setPanelDate}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

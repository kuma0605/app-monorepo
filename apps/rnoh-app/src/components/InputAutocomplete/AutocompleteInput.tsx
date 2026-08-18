/* eslint-disable no-void */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  type TextInput as TextInputType,
  type LayoutRectangle,
} from 'react-native';
import {Portal} from '@ant-design/react-native';
import type {
  InputAutocompleteItem,
  InputAutocompleteProps,
  InputAutocompleteRef,
} from './types';

const LIST_MAX_HEIGHT = 150;

function getLabel(item: InputAutocompleteItem): string {
  if (typeof item === 'string') {
    return item;
  }
  return String(item.text ?? '');
}

function includesKeyword(text: string, keyword: string): boolean {
  const q = keyword.trim();
  if (!q) {
    return true;
  }
  return text.toUpperCase().includes(q.toUpperCase());
}

function HighlightLabel({
  text,
  keyword,
  color,
}: {
  text: string;
  keyword: string;
  color: string;
}) {
  const q = keyword.trim();
  if (!q) {
    return <Text style={styles.itemText}>{text}</Text>;
  }
  const idx = text.toUpperCase().indexOf(q.toUpperCase());
  if (idx < 0) {
    return <Text style={styles.itemText}>{text}</Text>;
  }
  const end = idx + q.length;
  return (
    <Text style={styles.itemText}>
      {idx > 0 ? <Text>{text.slice(0, idx)}</Text> : null}
      <Text style={{color}}>{text.slice(idx, end)}</Text>
      {end < text.length ? <Text>{text.slice(end)}</Text> : null}
    </Text>
  );
}

function AutocompleteInputInner<T extends InputAutocompleteItem>(
  props: InputAutocompleteProps<T>,
  ref: React.Ref<InputAutocompleteRef>,
) {
  const {
    value = '',
    placeholder,
    stringList,
    debounce = 0,
    min = 0,
    highlightColor = '#FF0000',
    loadData,
    onChangeText,
    onSelectItem,
    onFocus,
    scrollIntoView,
    inputStyle,
    style,
    disabled,
    testID,
  } = props;

  const [inputValue, setInputValue] = useState(value);
  const [source, setSource] = useState<T[]>(stringList ?? []);
  const [visible, setVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [dropdownLayout, setDropdownLayout] = useState<LayoutRectangle | null>(
    null,
  );

  const wrapRef = useRef<View>(null);
  const inputRef = useRef<TextInputType>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const inputValueRef = useRef(inputValue);
  const focusedRef = useRef(false);
  const selectingRef = useRef(false);

  useEffect(() => {
    setInputValue(value);
    inputValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (stringList) {
      setSource(stringList);
    }
  }, [stringList]);

  const suggestions = useMemo(() => {
    if (!keyword.trim() || keyword.length < min) {
      return [];
    }
    return source
      .map(item => ({label: getLabel(item), data: item}))
      .filter(row => includesKeyword(row.label, keyword));
  }, [source, keyword, min]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDropdownLayout(null);
  }, []);

  const updateDropdownLayout = useCallback(() => {
    const node = wrapRef.current;
    if (!node) {
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setDropdownLayout({x, y, width, height});
      }
    });
  }, []);

  useEffect(() => {
    const shouldShow = suggestions.length > 0 && focusedRef.current;
    setVisible(shouldShow);
    if (!shouldShow) {
      setDropdownLayout(null);
    }
  }, [suggestions.length]);

  useEffect(() => {
    if (!visible || suggestions.length === 0) {
      return;
    }
    updateDropdownLayout();
    const frame = requestAnimationFrame(updateDropdownLayout);
    return () => cancelAnimationFrame(frame);
  }, [suggestions, updateDropdownLayout, visible]);

  const keepInputFocused = useCallback(() => {
    if (!focusedRef.current) {
      return;
    }
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  useImperativeHandle(ref, () => ({
    dismiss,
    setInputValue: (text: string) => {
      inputValueRef.current = text;
      setInputValue(text);
      setKeyword(text);
    },
    getInputValue: () => inputValueRef.current,
  }));

  const fetchData = useCallback(
    async (text: string) => {
      const loader = loadData ?? (async () => (stringList ?? []) as T[]);
      const id = ++requestIdRef.current;
      try {
        const data = (await loader(text)) ?? [];
        if (id !== requestIdRef.current || text !== inputValueRef.current) {
          return;
        }
        setSource(data);
        setKeyword(text);
        if (data.length > 0 && text === inputValueRef.current) {
          setVisible(true);
          keepInputFocused();
        } else {
          setVisible(false);
        }
      } catch {
        if (id === requestIdRef.current) {
          setSource([]);
          setVisible(false);
        }
      }
    },
    [keepInputFocused, loadData, stringList],
  );

  const scheduleFetch = useCallback(
    (text: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (text.length < min) {
        setKeyword('');
        setVisible(false);
        return;
      }
      if (debounce > 0) {
        debounceRef.current = setTimeout(() => {
          void fetchData(text);
        }, debounce);
      } else {
        void fetchData(text);
      }
    },
    [debounce, fetchData, min],
  );

  const handleChangeText = useCallback(
    (text: string) => {
      inputValueRef.current = text;
      setInputValue(text);
      onChangeText?.(text);
      if (!loadData) {
        setKeyword(text);
        setVisible(text.length >= min);
        return;
      }
      scheduleFetch(text);
    },
    [loadData, min, onChangeText, scheduleFetch],
  );

  const handleSelect = useCallback(
    (label: string, data: T) => {
      const normalized = label.replace(/\s+/g, '');
      inputValueRef.current = normalized;
      setInputValue(normalized);
      setKeyword(normalized);
      onChangeText?.(normalized);
      onSelectItem?.(data);
      setVisible(false);
      setDropdownLayout(null);
      focusedRef.current = false;
    },
    [onChangeText, onSelectItem],
  );

  const showDropdown = visible && suggestions.length > 0 && dropdownLayout;

  return (
    <View
      ref={wrapRef}
      collapsable={false}
      onLayout={() => {
        if (visible) {
          updateDropdownLayout();
        }
      }}
      style={[styles.wrap, style]}
      testID={testID}>
      <TextInput
        ref={inputRef}
        value={inputValue}
        placeholder={placeholder}
        editable={!disabled}
        onChangeText={handleChangeText}
        onFocus={e => {
          focusedRef.current = true;
          scrollIntoView?.(wrapRef);
          requestAnimationFrame(updateDropdownLayout);
          onFocus?.(e);
        }}
        onBlur={() => {
          setTimeout(() => {
            if (!selectingRef.current) {
              focusedRef.current = false;
              setVisible(false);
            }
            selectingRef.current = false;
          }, 200);
        }}
        style={[styles.input, inputStyle]}
        autoCorrect={false}
        autoCapitalize="none"
        blurOnSubmit={false}
      />

      {showDropdown ? (
        <Portal>
          <View pointerEvents="box-none" style={styles.portalRoot}>
            <View
              style={[
                styles.dropdown,
                {
                  top: dropdownLayout.y + dropdownLayout.height,
                  left: dropdownLayout.x,
                  width: dropdownLayout.width,
                },
              ]}>
              <ScrollView
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
                style={styles.list}
                bounces={false}>
                {suggestions.map((item, index) => (
                  <Pressable
                    key={`${item.label}-${index}`}
                    style={styles.item}
                    onPressIn={() => {
                      selectingRef.current = true;
                    }}
                    onPress={() => handleSelect(item.label, item.data)}>
                    <HighlightLabel
                      text={item.label}
                      keyword={keyword}
                      color={highlightColor}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Portal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minHeight: 36,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 6,
    paddingHorizontal: 0,
    textAlign: 'right',
  },
  portalRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  dropdown: {
    position: 'absolute',
    maxHeight: LIST_MAX_HEIGHT,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f3f3f4',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 12,
  },
  list: {
    maxHeight: LIST_MAX_HEIGHT,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 15,
    color: '#333',
  },
});

const AutocompleteInput = forwardRef(AutocompleteInputInner) as <
  T extends InputAutocompleteItem = InputAutocompleteItem,
>(
  props: InputAutocompleteProps<T> & {ref?: React.Ref<InputAutocompleteRef>},
) => React.ReactElement | null;

export default AutocompleteInput;

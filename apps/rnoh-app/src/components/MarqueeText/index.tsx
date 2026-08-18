import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  TextStyle,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  withDelay,
} from 'react-native-reanimated';

interface MarqueeTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  duration?: number;
  gap?: number;
  delay?: number;
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  style,
  containerStyle,
  duration,
  gap = 50,
  delay = 1500,
}) => {
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const translateX = useSharedValue(0);

  const shouldAnimate = textWidth > containerWidth && containerWidth > 0;

  useEffect(() => {
    if (shouldAnimate) {
      translateX.value = 0;

      const translateDistance = -textWidth - gap;
      // Calculate duration to maintain a constant speed of 30 pixels per second
      const actualDuration = duration || ((textWidth + gap) / 30) * 1000;

      translateX.value = withRepeat(
        withDelay(
          delay,
          withTiming(translateDistance, {
            duration: actualDuration,
            easing: Easing.linear,
          }),
        ),
        -1, // infinite loop
        false, // no reverse
      );
    } else {
      cancelAnimation(translateX);
      translateX.value = 0;
    }
  }, [
    textWidth,
    containerWidth,
    translateX,
    duration,
    gap,
    delay,
    shouldAnimate,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: translateX.value}],
      flexDirection: 'row',
    };
  });

  const onTextLayout = (e: LayoutChangeEvent) => {
    setTextWidth(e.nativeEvent.layout.width);
  };

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={onContainerLayout}>
      {/* Hidden text for intrinsic width measurement */}
      <View style={styles.hiddenTextContainer}>
        <Text
          style={[style, styles.hiddenText]}
          onLayout={onTextLayout}
          numberOfLines={1}>
          {text}
        </Text>
      </View>

      <Animated.View
        style={[
          shouldAnimate ? animatedStyle : styles.row,
          shouldAnimate && {width: 99999},
        ]}>
        <Text style={[style, styles.text]} numberOfLines={1}>
          {text}
        </Text>
        {shouldAnimate && (
          <Text
            style={[style, styles.text, {marginLeft: gap}]}
            numberOfLines={1}>
            {text}
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  text: {
    // text inherits styles from props
  },
  hiddenTextContainer: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
    width: 10000,
    flexDirection: 'row',
  },
  hiddenText: {
    // no wrapping to measure full width
  },
});

export default MarqueeText;

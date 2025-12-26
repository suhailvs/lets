import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

const SkeletonLoader = ({ width, height, borderRadius = 4 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const backgroundColor = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E0E0E0", "#F5F5F5"], // Light grey to slightly darker grey
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, backgroundColor },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    marginVertical: 5,
  },
});

export default SkeletonLoader;

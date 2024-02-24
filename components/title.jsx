import { StyleSheet, Text, Animated, Pressable } from "react-native";
import React, { useContext } from "react";
import * as animations from "../js/animations/mainAnimations";

export default function Title({}) {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: animations.screen.height * 0.08,
          opacity: animations.title.animate_opacity,
          // opacity: animations.animation_Values.broadClockState,
          transform: [{ translateY: animations.title.animate_position }],
        },
      ]}
    >
      <Pressable>
        <Text style={styles.text}>You're on the clock!</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    position: "absolute",
    // borderWidth: 1,
    // borderColor: "purple",
  },
  text: {
    color: "white",
    fontSize: 40,
  },
});

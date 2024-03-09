import { StyleSheet, View, Text, Animated } from "react-native";
import React, { useEffect } from "react";
import * as animations from "../js/animations/mainAnimations";

export default function Counter({ ticker }) {
  const { counter } = animations;

  const seconds = ticker.seconds.toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

  const minutes = ticker.minutes.toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

  const hours = ticker.hours.toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

  const calculatedTop =
    animations.screen.width * 0.25 + animations.screen.height * 0.5;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: calculatedTop, opacity: counter.animate_opacity },
      ]}
    >
      <View style={styles.innerContainer}>
        <Text style={[styles.text, {}]}>{hours}</Text>
        <Animated.Text
          style={[styles.divider, { opacity: counter.animate_tickerOpacity }]}
        >
          :
        </Animated.Text>
        <Text style={[styles.text, {}]}>{minutes}</Text>
        <Animated.Text
          style={[styles.divider, { opacity: counter.animate_tickerOpacity }]}
        >
          :
        </Animated.Text>
        <Text style={[styles.text]}>{seconds}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    // borderWidth: 1,
    // borderColor: "purple",
    alignItems: "center",
    // justifyContent: "center",
    width: "100%",
  },
  innerContainer: {
    flexDirection: "row",
    // alignItems: "center",
    textAlign: "center",
    justifyContent: "center",
    width: "90%",
    paddingTop: 20,
    paddingBottom: 20,
    borderColor: "chocolate",
    borderWidth: 1,
    borderRadius: 8,
  },
  text: {
    color: "white",
    fontSize: 40,
  },
  divider: {
    color: "white",
    fontSize: 35,
    paddingLeft: 10,
    paddingRight: 10,
  },
  hoursTicker: {},
});

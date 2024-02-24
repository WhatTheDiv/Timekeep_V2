import { StyleSheet, Text, View, Animated, Pressable } from "react-native";
import React from "react";
import * as animations from "../js/animations/mainAnimations";
import { press_changeClockState } from "../js/pageFuncs/home";

export default ({ title, activeClock }) => {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animations.mainButton.animate_opacity,
          transform: [
            {
              translateY: animations.mainButton.animate_buttonLocation,
            },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            width: animations.screen.width,
            height: animations.screen.width,
            transform: [
              { scale: animations.mainButton.animate_scale },
              {
                translateY:
                  animations.mainButton.animate_buttonLocationScaleHelper,
              },
            ],
          },
        ]}
      >
        <Pressable
          style={styles.button}
          onPress={press_changeClockState}
          disabled={title === false ? false : true}
        >
          <View style={styles.buttonInnerContainer}>
            <Text style={styles.buttonText}>
              {title ? title : activeClock ? "Clock Out" : "Clock In!"}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    // borderColor: "red",
    // borderWidth: 1,

    top: 0,
    // transform: [{ translateY: 50 }],

    // animating opacity
  },
  buttonWrapper: {
    // position: "absolute",
    // top: 0,
    // dynamic width
    // dynamic height

    // animating scale
    transformOrigin: "top",
    padding: 5,
    // borderWidth: 1,
    // borderColor: "green",
  },
  button: {
    backgroundColor: "chocolate",
    borderRadius: 200,
    shadowColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonInnerContainer: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 300,
    width: "98%",
    height: "98%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 50,
  },
});

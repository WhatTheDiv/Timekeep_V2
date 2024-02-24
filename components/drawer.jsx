import { StyleSheet, View, Animated } from "react-native";
import { useEffect, useState } from "react";
import React from "react";
import { useImmer } from "use-immer";
import { drawer } from "../js/animations/mainAnimations";
import Drawer_lg from "../components/drawer_lg";
import Drawer_sm from "../components/drawer_sm";

export default function Drawer({ activeClock, pockets, setPockets }) {
  const drawerHeight = {
    expanded: drawer.drawerMaxHeight * 0.9,
    hidden: drawer.drawerMaxHeight * 0.2,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: drawer.animate_opacity,
          height: drawer.drawerMaxHeight,
          bottom: drawer.drawerMaxHeight * -1.1,
          transform: [{ translateY: drawer.animate_position }],
        },
      ]}
    >
      <View
        style={[
          styles.innerContainer,
          { height: drawerHeight[activeClock ? "hidden" : "expanded"] },
        ]}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            flexDirection: "row",
          }}
        >
          <View />
          {activeClock ? (
            <Drawer_sm />
          ) : (
            <Drawer_lg pockets={pockets} setPockets={setPockets} />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    backgroundColor: "chocolate",
    borderRadius: 10,
    overflow: "hidden",
  },
  innerContainer: {
    width: "100%",
    // borderWidth: 1,
    // borderColor: "white",
    padding: 0,
    alignItems: "center",
  },
});

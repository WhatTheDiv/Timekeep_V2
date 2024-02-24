import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import gStyle from "../styles/globalStyle";
import { router } from "expo-router";
import { Stack } from "expo-router";

const errorFallback = ({ settingsPage = false }) => {
  return (
    <>
      {/* If loading fallback on settings page */}
      {settingsPage && <Stack.Screen options={{ headerShown: false }} />}

      {/* Error fallback */}
      <View style={styles.container}>
        <Text style={[gStyle.text_medium, gStyle.text_orange, styles.text]}>
          Looks like we're off course ...
        </Text>
        <Pressable
          style={[gStyle.button_Primary_container, styles.button]}
          onPress={() => router.replace("/")}
        >
          <Text style={gStyle.text_small}>Go Home</Text>
        </Pressable>
      </View>
    </>
  );
};

export default errorFallback;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "white",
    marginHorizontal: 20,
    textAlign: "center",
    paddingBottom: 40,
  },
  button: {
    width: "90%",
    alignItems: "center",
    paddingVertical: 10,
  },
});

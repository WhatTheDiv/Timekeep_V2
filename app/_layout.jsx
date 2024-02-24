import { StyleSheet, View } from "react-native";
import gStyle from "../styles/globalStyle";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import Store from "../js/Store/store";
import { Provider } from "react-redux";

export default () => {
  useEffect(() => {});
  return (
    // [ ] Fallback to error page if platform is 'web' or 'ios'
    // [ ] or create new database scheme for 'web'
    <>
      <View style={gStyle.StatusBar} />
      <Provider store={Store}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen
            name="settings"
            options={{
              title: "Settings",
              headerBackVisible: true,
              headerTintColor: "#fff",
              headerTitleAlign: "center",
              headerStyle: {
                backgroundColor: "#000",
              },
            }}
          />
        </Stack>
      </Provider>
    </>
  );
};

// export const unstable_settings = {
//   initialRouteName: "index",
// };

const styles = StyleSheet.create({});

import { Pressable, StyleSheet, Text, View } from "react-native";
import ErrorFallback from "./errorFallback";
import React, { useEffect, useState } from "react";
import * as globalFuncs from "../js/pageFuncs/global";
import { router } from "expo-router";
import Store from "../js/Store/store";
import { check_OutOfOrder } from "../js/pageFuncs/global";

export default ({ setActiveClock, setTicker }) => {
  if (check_OutOfOrder()) return <ErrorFallback settingsPage={true} />;
  const [privacyMode, setPrivacyMode] = useState(
    Store.getState().data.settings.privacy
  );

  useEffect(() => {
    const sub = Store.subscribe(() => {
      if (!Store.getState().setup.setup) router.replace("/");

      if (privacyMode !== Store.getState().data.settings.privacy)
        setPrivacyMode(Store.getState().data.settings.privacy);
    });
    return sub;
  });

  return (
    <View style={styles.container}>
      {/*  Delete User Data */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={styles.button_container}
          onPress={globalFuncs.delete_SettingsAndUserData}
        >
          <Text style={styles.button_text}>Delete settings and user data</Text>
        </Pressable>
      </View>

      {/* Delete All Data From Database */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={styles.button_container}
          onPress={() => globalFuncs.delete_AllDatabase()}
        >
          <Text style={styles.button_text}>Clear database</Text>
        </Pressable>
      </View>

      {/* Log the state */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={styles.button_container}
          onPress={() => console.table(Store.getState())}
        >
          <Text style={styles.button_text}>Log current state</Text>
        </Pressable>
      </View>

      {/* Privacy mode */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={styles.button_container}
          onPress={() => globalFuncs.togglePrivacyMode()}
        >
          <Text style={styles.button_text}>
            Toggle privacy mode ({privacyMode ? "On" : "Off"})
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  sectionContainer: {
    marginVertical: 20,
    width: "100%",
    alignItems: "center",
  },
  button_container: {
    paddingVertical: 20,
    width: "90%",
    alignItems: "center",
    backgroundColor: "orange",
  },
  button_text: {},
});

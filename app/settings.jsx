import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import ErrorFallback from "./errorFallback";
import React, { useEffect, useState } from "react";
import * as globalFuncs from "../js/pageFuncs/global";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import Store from "../js/Store/store";
import { check_OutOfOrder } from "../js/pageFuncs/global";
import gStyles from "../styles/globalStyle";

export default ({ setActiveClock, setTicker }) => {
  if (check_OutOfOrder()) return <ErrorFallback settingsPage={true} />;
  const [privacyMode, setPrivacyMode] = useState(
    Store.getState().data.settings.privacy
  );

  const [currDb, setCurrDb] = useState(0);

  useEffect(() => {
    setDbValueDisplayed({
      currIndex: Store.getState().data.settings.dbIndex,
      setCurrDb,
      currDb: null,
      dir: null,
    });

    const sub = Store.subscribe(() => {
      if (!Store.getState().setup.setup) router.replace("/");

      if (privacyMode !== Store.getState().data.settings.privacy)
        setPrivacyMode(Store.getState().data.settings.privacy);
    });

    return sub;
  });

  return (
    <ScrollView style={styles.container}>
      {/* Log the state */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={styles.button_container}
          onPress={() => console.table(Store.getState())}
        >
          <Text style={gStyles.text_bold}>Log State</Text>
        </Pressable>
      </View>

      {/* Privacy mode */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={styles.button_container}
          onPress={() => globalFuncs.togglePrivacyMode()}
        >
          <Text style={gStyles.text_bold}>
            Toggle Privacy Mode ( Currently {privacyMode ? "On" : "Off"} )
          </Text>
        </Pressable>
      </View>

      {/* Download Database */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={styles.button_container}
          onPress={() => globalFuncs.downloadDatabase()}
        >
          <Text style={gStyles.text_bold}>Download Database</Text>
        </Pressable>
      </View>

      {/* Import Database */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={styles.button_container}
          onPress={() => globalFuncs.importDatabase()}
        >
          <Text style={gStyles.text_bold}>Import Database</Text>
        </Pressable>
      </View>

      {/* Reset current database */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={styles.button_container}
          onPress={() => globalFuncs.reset_Database()}
        >
          <Text style={gStyles.text_bold}>Reset current database</Text>
        </Pressable>
      </View>

      {/* Switch current database */}
      <Text
        style={[gStyles.text_white, { textAlign: "center", marginBottom: 5 }]}
      >
        Switch / Add Database
      </Text>
      <View style={[styles.sectionContainer, { marginTop: 0 }]}>
        <View
          style={[
            gStyles.background_orange,
            { width: "90%", flexDirection: "row" },
          ]}
        >
          <Pressable
            onPress={() => {
              setDbValueDisplayed({
                dir: "dec",
                currDb,
                setCurrDb,
                currIndex: null,
              });
            }}
            style={styles.switchDbButton_container}
          >
            <Text style={[styles.switchDbButton_text, gStyles.text_bold]}>
              -
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setDbValueDisplayed({
                dir: "inc",
                currDb,
                setCurrDb,
                currIndex: null,
              });
            }}
            style={styles.switchDbButton_container}
          >
            <Text style={[styles.switchDbButton_text, gStyles.text_bold]}>
              +
            </Text>
          </Pressable>
          <View style={styles.switchDbButton_container}>
            <Text
              style={[
                styles.switchDbButton_text,
                gStyles.background_orange,
                gStyles.text_bold,
              ]}
            >
              {currDb}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              globalFuncs.switchDatabase({ dbIndex: currDb, newDb: false })
            }
            style={[styles.switchDbButton_container]}
          >
            <Text style={[styles.switchDbButton_text, gStyles.text_bold]}>
              Set
            </Text>
          </Pressable>
          <Pressable
            onPress={() => globalFuncs.switchDatabase({ newDb: true })}
            style={[styles.switchDbButton_container, { marginLeft: 0 }]}
          >
            <Text style={[styles.switchDbButton_text, gStyles.text_bold]}>
              Create New
            </Text>
          </Pressable>
        </View>
      </View>

      {/*  Delete User Information & Settings */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={[styles.button_container, gStyles.background_red]}
          onPress={globalFuncs.delete_SettingsAndUserData}
        >
          <Text style={gStyles.text_bold}>
            Delete User Information & Settings
          </Text>
        </Pressable>
      </View>

      {/* Permanently Delete All Databases */}
      <View style={styles.sectionContainer}>
        <Pressable
          style={[styles.button_container, gStyles.background_red]}
          onPress={globalFuncs.deleteEveryDatabase}
        >
          <Text style={[gStyles.text_bold]}>
            Permanently Delete All Databases
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

async function setDbValueDisplayed({ dir, currDb, setCurrDb, currIndex }) {
  const increment = (c, arr, i, len, set) => {
    set(i + 1 >= len ? arr[0] : arr[i + 1]);
  };
  const decrement = (c, arr, i, len, set) => {
    set(i - 1 < 0 ? len - 1 : i - 1);
  };

  const indexes = await getDbArray();

  const curr =
    currIndex !== null
      ? indexes[currIndex]
      : indexes[indexes.indexOf(Number(currDb))];

  console.log({
    curr,
    currIndex,
    indexes,
  });

  if (dir === "inc") {
    increment(curr, indexes, indexes.indexOf(curr), indexes.length, setCurrDb);
  }
  if (dir === "dec") {
    decrement(curr, indexes, indexes.indexOf(curr), indexes.length, setCurrDb);
  } else {
    setCurrDb(curr);
  }
}

async function getDbArray() {
  return (
    await FileSystem.readDirectoryAsync(
      FileSystem.documentDirectory + "SQLite/"
    )
  )
    .filter((name) => name.indexOf("-journal") === -1)
    .map((item) => Number(item.slice(2, item.indexOf("."))));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  sectionContainer: {
    marginVertical: 15,
    width: "100%",
    alignItems: "center",
  },
  switchDbButton_container: {
    alignItems: "center",
    flex: 1,
    // borderWidth: 1,
    // borderColor: "red",
  },
  switchDbButton_text: {
    paddingVertical: 10,
    backgroundColor: "chocolate",
    margin: 2,
    width: "95%",
    height: 50,
    verticalAlign: "middle",
    textAlign: "center",
    justifyContent: "center",
  },
  button_container: {
    paddingVertical: 20,
    width: "90%",
    alignItems: "center",
    backgroundColor: "orange",
  },
});

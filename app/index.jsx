import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import gStyle from "../styles/globalStyle";
import { set_Store } from "../js/pageFuncs/index";
import { Picker } from "@react-native-picker/picker";
import { useImmer } from "use-immer";
import { router } from "expo-router";

import Store from "../js/Store/store.js";

export default () => {
  const [setup, setSetup] = useState(Store.getState().setup);

  const [form, setForm] = useImmer({
    user_name: "",
    wage: {
      num: 0,
      period: "year",
    },
  });

  const av = {
    startup: useRef(new Animated.Value(0)).current,
    mainButtonScale: useRef(new Animated.Value(1)).current,
    buttonLocation: useRef(new Animated.Value(0)).current,
    broadClockState: useRef(new Animated.Value(0)).current,
    counterTicker: useRef(new Animated.Value(1)).current,
    drawer: useRef(new Animated.Value(0)).current,
    drawerStartup: useRef(new Animated.Value(0)).current,
  };

  const firstRun = !setup.loading && !setup.hasUserData && !setup.setup;

  useEffect(() => {
    const subscription = Store.subscribe(() => handle_subscription(setSetup));

    get_Precheck(av);

    return subscription;
  }, []);

  if (firstRun) return render_loadingPage();
  else return render_starterPage(form, setForm);
};

// INITIAL FUNCTION
const get_Precheck = async (av) => {
  console.log("running precheck in index ... ");
  try {
    await set_Store(null, av);
  } catch (e) {
    console.error("Error in precheck - " + e.message);
    console.error(e);

    set_Store({ hasData: false, data: null });
  }
};

// RENDER FUNCTIONS
const render_starterPage = (form, setForm) => {
  // return <Text>Nothing</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Text
          style={[
            gStyle.text_medium,
            styles.text_primary,
            { alignSelf: "center", textAlign: "center" },
          ]}
        >
          Enter your information
        </Text>
        <View style={styles.sectionsContainer}>
          {/* Name */}
          <View style={styles.section}>
            <Text
              style={[
                gStyle.text_small,
                styles.text_secondary,
                { marginRight: 10, paddingBottom: 10 },
              ]}
            >
              Name:
            </Text>
            <TextInput
              style={styles.nameInputField}
              onChange={(e) =>
                handle_FormInputChange({
                  sec: "name",
                  newVal: e.nativeEvent.text,
                  setForm,
                })
              }
            />
          </View>

          {/* Wage */}
          <View style={styles.section}>
            <Text
              style={[
                gStyle.text_small,
                styles.text_secondary,
                { marginRight: 10, paddingBottom: 5 },
              ]}
            >
              Wage:
            </Text>
            <View style={styles.wageInputContainer}>
              <TextInput
                style={styles.wageInputField}
                inputMode={"numeric"}
                onChange={(e) =>
                  handle_FormInputChange({
                    sec: "num",
                    newVal: e.nativeEvent.text,
                    setForm,
                  })
                }
              />
              <Text
                style={[
                  gStyle.text_medium,
                  styles.text_secondary,
                  { paddingHorizontal: 10 },
                ]}
              >
                /
              </Text>
              <Picker
                selectedValue={form.wage.period}
                onValueChange={(val) =>
                  handle_FormInputChange({
                    sec: "period",
                    newVal: val,
                    setForm,
                  })
                }
                style={[gStyle.text_small, styles.wagePicker]}
                dropdownIconColor="white"
              >
                <Picker.Item value={"year"} label={"Year"} />
                <Picker.Item value={"hour"} label={"Hour"} />
              </Picker>
            </View>
          </View>
        </View>
        <Pressable
          style={styles.submitButton}
          onPress={() => handle_FormSubmit(form)}
        >
          <Text style={[gStyle.text_medium]}>Submit</Text>
        </Pressable>
      </View>
    </View>
  );
};
const render_loadingPage = () => {
  return (
    <View
      style={{
        backgroundColor: "#000",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={[gStyle.text_large, { color: "white" }]}>Loading ... </Text>
    </View>
  );
};

// HANDLE FUNCTIONS
const handle_FormInputChange = ({ sec, newVal, setForm }) => {
  switch (sec) {
    case "period":
      return setForm((draft) => {
        draft.wage.period = newVal;
      });

    case "num":
      return setForm((draft) => {
        draft.wage.num = newVal;
      });
    case "name":
      return setForm((draft) => {
        draft.user_name = newVal;
      });
  }
};
const handle_FormSubmit = async (form) => {
  try {
    await set_Store(form);
  } catch (e) {
    console.error("Error saving data - " + e.message);
    console.error(e.error);

    set_Store({ hasData: false, data: null });
  }
};
export function handle_subscription(setSetup) {
  const state = Store.getState().setup;

  if (state.setup && !state.loading && state.hasUserData) {
    console.log("Store set.");
    router.replace("home");
  } else setSetup(state);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerContainer: {
    width: "90%",
    marginHorizontal: 10,
  },
  sectionsContainer: {
    paddingVertical: 40,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  nameInputField: {
    color: "orange",
    flex: 1,
    textAlign: "center",
    paddingTop: 5,
    marginVertical: 5,
    borderBottomWidth: 1,
    borderColor: "#d1d1d1",
  },
  wageInputContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#d1d1d1",
    alignItems: "flex-end",
  },
  wageInputField: {
    color: "orange",
    minWidth: 60,
    textAlign: "center",
    flex: 1,
  },
  wagePicker: {
    width: 110,
    color: "orange",
    height: 30,
    transform: [{ translateY: Platform.OS === "android" ? 10 : 0 }],
    backgroundColor: "inherit",
    borderWidth: 0,
  },
  text_primary: { color: "orange" },
  text_secondary: { color: "#d1d1d1" },
  submitButton: {
    backgroundColor: "orange",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
  },
});

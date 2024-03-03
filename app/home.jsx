import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  AppState,
} from "react-native";
import React, { useEffect, useState } from "react";
import ErrorFallback from "./errorFallback";
import { check_OutOfOrder } from "../js/pageFuncs/global";
import Store from "../js/Store/store.js";
import Title from "../components/title";
import BigButton from "../components/bigButton";
import Drawer from "../components/drawer";
import Counter from "../components/counter";
import { startup } from "../js/pageFuncs/home";
import { Link } from "expo-router";
import { icons } from "../js/utils/icons.js";
import { useImmer } from "use-immer";
import { updateClockOnAppRestored } from "../js/utils/clock";
import { handleSubscription_home } from "../js/pageFuncs/subscriptions";

export default function home() {
  if (check_OutOfOrder()) return <ErrorFallback />;
  const state = Store.getState();

  const [title, setTitle] = useState(state.setup.appName);
  const [activeClock, setActiveClock] = useState(false);

  const [pockets, setPockets] = useImmer({
    stats: {
      open: state.data.settings.statsTab_open,
      selected: null,
      loading: true,
    },
    hours: {
      open: state.data.settings.hoursTab_open,
      navigation: "view",
      selected: null,
      loading: true,
      edit: -1,
    },
    loading: true,
  });
  const [ticker, setTicker] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    console.log("**** home, main load");
    const active = Store.getState().ui.clock.active;

    // Grabs active clock from state
    console.log("Grabbing active clock from state: ");
    setActiveClock(active);
    setTicker({ hours: 0, minutes: 0, seconds: 0 });

    // Handle ticker on page restore
    AppState.addEventListener("change", () =>
      updateClockOnAppRestored({ setTicker, AppState })
    );

    // Starts animation & ticker
    startup({ setTitle, setTicker, activeClock: active });

    // Handles change of clock state, and saves settings to AsyncStorage
    const subscribe = handleSubscription_home({
      setActiveClock,
      setTicker,
      pockets,
      setPockets,
    });

    return () => {
      console.log("cleanup home ... ");
      setTicker({ hours: 0, minutes: 0, seconds: 0 });
      setActiveClock(false);
      subscribe();
    };
  }, []);

  useEffect(() => {
    console.log("changing state of activeClock,  activeClock:", activeClock);
  }, [activeClock]);

  return (
    <View style={styles.container}>
      {/* Settings Button */}
      <Link href={"/settings"} asChild>
        <Pressable style={styles.settingsButton}>
          <Image
            style={styles.settingsButtonIcon}
            source={icons.SettingsIcon}
          ></Image>
        </Pressable>
      </Link>

      {/* Components */}
      <Title />
      <BigButton title={title} activeClock={activeClock} />
      <Counter ticker={{ ...ticker }} />
      <Drawer
        activeClock={activeClock}
        pockets={pockets}
        setPockets={setPockets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  settingsButton: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 10,
  },
  settingsButtonIcon: {
    width: 20,
    height: 20,
    tintColor: "gray",
  },
});

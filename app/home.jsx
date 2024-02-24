import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import React, { useEffect, useState } from "react";
import ErrorFallback from "./errorFallback";
import { check_OutOfOrder } from "../js/pageFuncs/global";
import Store from "../js/Store/store";
import Title from "../components/title";
import BigButton from "../components/bigButton";
import Drawer from "../components/drawer";
import Counter from "../components/counter";
import { startup, handle_subscription_home } from "../js/pageFuncs/home";
import { Link } from "expo-router";
import { icons } from "../js/utils/icons";
import { useImmer } from "use-immer";

export default function home() {
  if (check_OutOfOrder()) return <ErrorFallback />;
  const state = Store.getState();

  const [title, setTitle] = useState(Store.getState().setup.appName);
  const [activeClock, setActiveClock] = useState(
    Store.getState().ui.clock.active
  );

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
    Store.subscribe(() =>
      handle_subscription_home({
        setActiveClock,
        setTicker,
        pockets,
        setPockets,
      })
    );
    startup({ setTitle, setTicker });
  }, []);

  return (
    <View style={styles.container}>
      <Link push href="/settings" asChild>
        <Pressable style={styles.settingsButton}>
          <Image
            style={styles.settingsButtonIcon}
            // @ts-ignore
            source={icons.SettingsIcon}
          ></Image>
        </Pressable>
      </Link>
      <Title />
      <BigButton title={title} activeClock={activeClock} />
      <Counter ticker={ticker} />
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

import { StyleSheet, Text, View } from "react-native";
import React from "react";
import gStyles from "../styles/globalStyle";

const stats = ({ pockets, setPockets }) => {
  // ( Year To Date )
  // [ ] hours this week
  // [ ] hours last week
  // [ ] avg $/h ( factoring overtime )
  // [ ] avg $/h ( without overtime )
  // [ ] average hours per week
  // [ ] total hours over 40
  // [ ] Should-be salary ( converted to hourly ) ( factoring overtime )
  // [ ]
  // [ ]
  // [ ]
  // [ ] selected item stats:
  // [ ] - time range
  // [ ] - hours this day
  // [ ] - hours this week
  // [ ] - OT hours this week
  // [ ] - avg $/h this week
  // [ ] - delete, edit

  const view_selection =
    pockets.stats.selected && pockets.hours.navigation === "view";
  return (
    <View>
      {view_selection && <Text style={{ color: "white" }}>Something here</Text>}
    </View>
  );
};

function render_selection() {}

function render_ytd() {}

export default stats;

const styles = StyleSheet.create({});

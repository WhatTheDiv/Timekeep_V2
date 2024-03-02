import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import gStyles from "../styles/globalStyle";
import Store from "../js/Store/store.js";
import * as Format from "../js/utils/format.js";
import * as Clock from "../js/utils/clock";

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

  const privacyMode = Store.getState().data.settings.privacy;

  return (
    <ScrollView style={styles.container}>
      {render_selection(pockets, privacyMode)}
      {render_ytd(privacyMode)}
    </ScrollView>
  );
};

/*      Render       */
function render_selection({ stats }, privacyMode) {
  // Exit early if hours item is not selected
  if (stats.selected === null) return;

  const format_startTimeEndTimeStrings = ({ Start, End }) => {
    const startTimeObj = Format.millis_ToDateObj(Start);
    const hour_start = Format.hoursMilitary_ToStandardWithAmPm(
      startTimeObj.hour
    );

    const formatted_startTime =
      hour_start.hour +
      ":" +
      startTimeObj.minute +
      hour_start.ampm.toLowerCase();

    const endTimeObj = Format.millis_ToDateObj(End);
    const hour_end = Format.hoursMilitary_ToStandardWithAmPm(endTimeObj.hour);
    const formatted_endTime =
      hour_end.hour + ":" + endTimeObj.minute + hour_end.ampm.toLowerCase();

    return { startString: formatted_startTime, endString: formatted_endTime };
  };
  const format_hoursThisWeek = (databaseItem_flag) => {
    const { array } = Clock.filterDatabase_WeekSegment_givenFlag(
      databaseItem_flag.Start
    );

    const { minutes, hours } = Format.millis_toSecondsMinutesHours(
      array.reduce(
        (total, curr) => total + (Number(curr.End) - Number(curr.Start)),
        0
      )
    );
    const hoursThisWeek = hours + minutes / 60;
    const regular = hoursThisWeek.toFixed(1);
    const ot = hoursThisWeek > 40 ? hoursThisWeek - 40 : 0;

    const hourlyRate =
      Clock.findHourlyEquivalent_factoringOt_OneWeek(array).toFixed(2);

    return { regular, ot: ot.toFixed(1), hourlyRate };
  };

  const currentItem = Store.getState().data.dataArray[stats.selected];

  const { day, date } = Format.millis_toMonthAndDayStrings(currentItem.Start);

  const { startString, endString } =
    format_startTimeEndTimeStrings(currentItem);

  const duration = Format.millis_toSecondsMinutesHoursString(
    currentItem.End - currentItem.Start,
    { trim: true }
  );

  const { regular, ot, hourlyRate } = format_hoursThisWeek(currentItem);

  return (
    <View style={styles.section}>
      <Text
        style={[gStyles.text_xSmall, gStyles.text_gray, styles.sectionHeader]}
      >
        {day}, {date}
      </Text>
      {/* Duration */}
      <View style={styles.row}>
        <Text style={[gStyles.text_small, gStyles.text_white, styles.col1]}>
          {startString} - {endString}
        </Text>
        <Text style={[gStyles.text_small, gStyles.text_white, styles.col2]}>
          {duration}
        </Text>
      </View>

      {/* Hours this week */}
      <View style={styles.row}>
        <Text style={[gStyles.text_small, gStyles.text_white]}>
          Hours (Selected Week)
        </Text>
        <Text style={[gStyles.text_small, gStyles.text_white, styles.col2]}>
          {regular}
        </Text>
      </View>

      {/* OT Hours this week */}
      <View style={styles.row}>
        <Text style={[gStyles.text_small, gStyles.text_white]}>
          OT Hours (Selected Week)
        </Text>
        <Text style={[gStyles.text_small, gStyles.text_white, styles.col2]}>
          {ot}
        </Text>
      </View>

      {/* Hourly equivelant */}
      <View style={styles.row}>
        <Text style={[gStyles.text_small, gStyles.text_white]}>
          True Rate / Hour (Selected Week)
        </Text>
        <Text style={[gStyles.text_small, gStyles.text_white, styles.col2]}>
          ${privacyMode ? "**.**" : hourlyRate}
        </Text>
      </View>
    </View>
  );
}
// XXX
function render_ytd(privacyMode) {
  const getAverages = () => {
    const getActual_RatePerHour = (len, totalOt, totalHours) => {
      const dollarsPerWeek = Format.dollarsPerPeriod("weekly");

      const dollarsPaidForDuration = len * dollarsPerWeek;

      if (totalHours >= 40 * len) return dollarsPaidForDuration / totalHours;
      else {
        const fullTimeHours = 40 * len;
        return dollarsPaidForDuration / (fullTimeHours + 1.5 * totalOt);
      }
    };
    const getShouldBe_RatePerHour = (len, totalOt, totalHours, ratePerHour) => {
      const hoursInAWorkWeek = 40;
      const dollarsPerWeek = Format.dollarsPerPeriod("weekly");
      const dollarsPaidForDuration = len * dollarsPerWeek;

      if (totalOt <= 0) {
        return dollarsPaidForDuration / totalHours;
      }

      return (
        (ratePerHour * (totalHours + 1.5 * totalOt)) / len / hoursInAWorkWeek
      );
    };

    const totalsArray = Clock.getAveragesYtd();

    const total_OtHours = totalsArray.reduce(
      (total, current) => total + (current.total > 40 ? current.total - 40 : 0),
      0
    );
    console.log("total_OtHours: ", total_OtHours);
    const total_hours = totalsArray.reduce(
      (total, current) => total + current.total,
      0
    );
    const arph = getActual_RatePerHour(
      totalsArray.length,
      total_OtHours,
      total_hours
    );

    const average_hoursPerWeek = total_hours / totalsArray.length;
    const average_OtHoursPerWeek = total_OtHours / totalsArray.length;
    const shouldBe_RatePerHour = getShouldBe_RatePerHour(
      totalsArray.length,
      total_OtHours,
      total_hours,
      Format.dollarsPerPeriod("hourly")
    );
    const shouldBe_salary = shouldBe_RatePerHour * 40 * 52;
    const actual_RatePerHour = arph;
    const actual_salary = arph * 40 * 52;

    return {
      total_OtHours: total_OtHours.toFixed(1),
      total_hours: total_hours.toFixed(1),
      average_hoursPerWeek: average_hoursPerWeek.toFixed(1),
      average_OtHoursPerWeek: average_OtHoursPerWeek.toFixed(1),
      shouldBe_RatePerHour: shouldBe_RatePerHour.toFixed(2),
      shouldBe_salary: shouldBe_salary.toFixed(0),
      actual_RatePerHour: actual_RatePerHour.toFixed(2),
      actual_salary: actual_salary.toFixed(0),
    };
  };

  const { start, total } = Clock.getTotalWeeklyHours(Date.now());
  const hoursThisWeek = total.toFixed(1);
  const hoursLastWeek = Clock.getTotalWeeklyHours(start - 1000).total.toFixed(
    1
  );
  const RatePerYear = Format.dollarsPerPeriod("yearly");
  const RatePerHour = Format.dollarsPerPeriod("hourly").toFixed(2);

  const {
    total_OtHours,
    total_hours,
    average_hoursPerWeek,
    average_OtHoursPerWeek,
    shouldBe_RatePerHour,
    shouldBe_salary,
    actual_RatePerHour,
    actual_salary,
  } = getAverages();

  return (
    <View style={styles.section}>
      <Text
        style={[gStyles.text_gray, gStyles.text_xSmall, styles.sectionHeader]}
      >
        Year To Date
      </Text>

      {/* Hours this week */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Hours (This Week)
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {hoursThisWeek}
        </Text>
      </View>

      {/* Hours last week */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Hours (Last Week)
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {hoursLastWeek}
        </Text>
      </View>

      {/* YTD Hours */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Hours (Year To Date)
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {total_hours}
        </Text>
      </View>

      {/* Avg Hours per week */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Hours / Week (Average)
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {average_hoursPerWeek}
        </Text>
      </View>

      {/* YTD OT */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          OT (Year To Date)
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {total_OtHours}
        </Text>
      </View>

      {/* Average OT / Week */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          OT / Week (Average)
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {average_OtHoursPerWeek}
        </Text>
      </View>

      {/* $/h */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Rate / Hour
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          ${privacyMode ? "**.**" : RatePerHour}
        </Text>
      </View>

      {/* Should-be $/h */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Rate / Hour (Should-be)
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          ${privacyMode ? "**.**" : shouldBe_RatePerHour}
        </Text>
      </View>

      {/* Actual $/h */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Rate / Hour (True)
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          ${privacyMode ? "**.**" : actual_RatePerHour}
        </Text>
      </View>

      {/* salary */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Rate / Year
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          $
          {privacyMode ? "**,***" : Number(RatePerYear).toLocaleString("en-US")}
        </Text>
      </View>

      {/* Should-be salary */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Rate / Year (Should-be)
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          $
          {privacyMode
            ? "**,***"
            : Number(shouldBe_salary).toLocaleString("en-US")}
        </Text>
      </View>
    </View>
  );
}

export default stats;

const styles = StyleSheet.create({
  container: {
    // borderColor: "green",
    // borderWidth: 1,
    flex: 1,
  },
  section: {
    // borderColor: "blue",
    // borderWidth: 1,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  sectionHeader: {
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  col1: {},
  col2: {
    textAlign: "right",
    flex: 1,
    flexDirection: "row",
  },
});

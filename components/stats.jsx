import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import gStyles from "../styles/globalStyle";
import Store from "../js/Store/store.js";
import * as Format from "../js/utils/format.js";
import * as Clock from "../js/utils/clock";

const stats = ({ pockets, setPockets }) => {
  const privacyMode = Store.getState().data.settings.privacy;

  return (
    <ScrollView style={styles.container}>
      {render_selection(pockets, privacyMode)}
      {render_ytd(privacyMode)}
    </ScrollView>
  );
};

/*      Render       */
function render_percentChangeText({ pos, pct, prs, fixed }) {
  return (
    <Text
      style={[
        gStyles.text_xSmall,
        gStyles[pos ? "text_green" : "text_red"],
        {
          padding: 25,
        },
      ]}
    >
      {pos ? "+ " : "- "}
      {fixed ? Number(pct).toFixed(prs) : Format.numberMaxPrecision(pct, prs)}%
      {"   "}
    </Text>
  );
}
function render_sectionDetail(text) {
  return <Text style={[gStyles.text_xSmall, gStyles.text_gray]}>({text})</Text>;
}
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
    const regular = Format.numberMaxPrecision(hoursThisWeek, 1);
    const ot = hoursThisWeek > 40 ? hoursThisWeek - 40 : 0;

    const { hourlyRate, fullWeek } =
      Clock.findHourlyEquivalent_factoringOt_OneWeek(array);

    return {
      regular,
      ot: Format.numberMaxPrecision(ot, 1),
      hourlyRate: hourlyRate.toFixed(2),
      fullWeek,
    };
  };

  const currentItem = Store.getState().data.dataArray[stats.selected];

  const { day, date } = Format.millis_toMonthAndDayStrings(currentItem.Start);

  const { startString, endString } =
    format_startTimeEndTimeStrings(currentItem);

  const duration = Format.millis_toSecondsMinutesHoursString(
    currentItem.End - currentItem.Start,
    { trim: true }
  );

  const { regular, ot, hourlyRate, fullWeek } =
    format_hoursThisWeek(currentItem);
  const currRate = Number(Format.dollarsPerPeriod("hourly"));
  const hoursInAWorkWeek = 40;

  const pctChange_hoursThisWeek = {
    pos: Number(regular + ot) >= Number(hoursInAWorkWeek),
  };
  const pctChange_hourlyRate = {
    pos: Number(hourlyRate) >= currRate,
  };

  pctChange_hoursThisWeek.pct = pctChange_hoursThisWeek.pos
    ? (Number(regular) / Number(hoursInAWorkWeek) - 1) * 100
    : (Number(hoursInAWorkWeek) / Number(regular) - 1) * 100;

  pctChange_hourlyRate.pct = pctChange_hourlyRate.pos
    ? (Number(hourlyRate) / Number(currRate) - 1) * 100
    : (Number(currRate) / Number(hourlyRate) - 1) * 100;

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

      {/* Hours (Selected Week) */}
      <View style={styles.row}>
        <Text style={[gStyles.text_small, gStyles.text_white]}>
          Hours {render_sectionDetail("Selected Week")}
        </Text>
        <Text style={[gStyles.text_small, gStyles.text_white, styles.col2]}>
          {fullWeek &&
            render_percentChangeText({
              pos: pctChange_hoursThisWeek.pos,
              pct: pctChange_hoursThisWeek.pct,
              prs: 1,
              fixed: false,
            })}
          {regular}
        </Text>
      </View>

      {/* OT Hours (Selected Week) */}
      <View style={styles.row}>
        <Text style={[gStyles.text_small, gStyles.text_white]}>
          OT Hours {render_sectionDetail("Selected Week")}
        </Text>
        <Text style={[gStyles.text_small, gStyles.text_white, styles.col2]}>
          {ot}
        </Text>
      </View>

      {/* True Rate / Hour (Selected Week) */}
      <View style={styles.row}>
        <Text style={[gStyles.text_small, gStyles.text_white]}>
          True Rate / Hour {render_sectionDetail("Selected Week")}
        </Text>
        <Text style={[gStyles.text_small, gStyles.text_white, styles.col2]}>
          {render_percentChangeText({
            pos: pctChange_hourlyRate.pos,
            pct: pctChange_hourlyRate.pct,
            prs: 1,
            fixed: false,
          })}
          {privacyMode ? " -" : "$" + hourlyRate}
        </Text>
      </View>
    </View>
  );
}
function render_ytd(privacyMode) {
  const getAverages = () => {
    const getActual_RatePerHour = (len, totalOt, totalHours) => {
      const dollarsPerWeek = Format.dollarsPerPeriod("weekly");

      const dollarsPaidForDuration = len * dollarsPerWeek;

      if (totalOt <= 0) {
        return dollarsPaidForDuration / totalHours;
      } else {
        const fullTimeHours = totalHours - totalOt;
        return dollarsPaidForDuration / (fullTimeHours + 1.5 * totalOt);
      }
    };
    const getShouldBe_RatePerHour = (len, totalOt, totalHours, ratePerHour) => {
      const hoursInAWorkWeek = 40;
      const dollarsPerWeek = Format.dollarsPerPeriod("weekly");
      const dollarsPaidForDuration = len * dollarsPerWeek;
      const regularHours = totalHours - totalOt;

      if (totalOt <= 0) {
        return dollarsPaidForDuration / totalHours;
      }

      const otHourEquiv = 1.5 * totalOt;
      const effectiveHours = regularHours + otHourEquiv;
      const totalPaidForDurationIfHourly = ratePerHour * effectiveHours;
      const averagePaidPerWeek = totalPaidForDurationIfHourly / len;
      const effectiveSalaryHourlyRate = averagePaidPerWeek / hoursInAWorkWeek;

      return effectiveSalaryHourlyRate;
    };

    // totalsArray = [ {start: 1704690000002, end: 1705294800002, total: 39.983333333333334, daysWorked: 5}, ]
    const totalsArray = Clock.getAveragesYtd();

    // Handle empty array of hours
    if (totalsArray.length <= 0)
      return {
        total_OtHours: 0,
        total_hours: 0,
        average_hoursPerWeek: 0,
        average_OtHoursPerWeek: 0,
        shouldBe_RatePerHour: Format.dollarsPerPeriod("hourly").toFixed(2),
        shouldBe_salary: Format.numberMaxPrecision(
          Format.dollarsPerPeriod("yearly"),
          0
        ),
        actual_RatePerHour: Format.dollarsPerPeriod("hourly").toFixed(2),
      };

    // [ ] check first week for incomplete week. Weigh seperately. Maybe just make a prompt to add 0 hour hours at beginning of first week

    // check last week for incomplete week. Do not factor incomplete week
    if (totalsArray[totalsArray.length - 1].incomplete) totalsArray.pop();

    const total_OtHours = totalsArray.reduce(
      (total, current) => total + (current.total > 40 ? current.total - 40 : 0),
      0
    );

    const total_hours = totalsArray.reduce(
      (total, current) => total + current.total,
      0
    );

    console.log("totals Array : ", totalsArray);
    console.log("total_OtHours : ", total_OtHours);
    console.log("total_hours : ", total_hours);

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
      total_OtHours: Format.numberMaxPrecision(total_OtHours, 1),
      total_hours: Format.numberMaxPrecision(total_hours, 1),
      average_hoursPerWeek: Format.numberMaxPrecision(average_hoursPerWeek, 1),
      average_OtHoursPerWeek: Format.numberMaxPrecision(
        average_OtHoursPerWeek,
        1
      ),
      shouldBe_RatePerHour: shouldBe_RatePerHour.toFixed(2),
      shouldBe_salary: shouldBe_salary.toFixed(0),
      actual_RatePerHour: actual_RatePerHour.toFixed(2),
      actual_salary: actual_salary.toFixed(0),
    };
  };

  const { start, total } = Clock.getTotalWeeklyHours(Date.now());
  const hoursThisWeek = Format.numberMaxPrecision(total, 1);
  const hoursLastWeek = Format.numberMaxPrecision(
    Clock.getTotalWeeklyHours(start - 1000).total,
    1
  );
  const RatePerYear = Format.numberMaxPrecision(
    Format.dollarsPerPeriod("yearly"),
    0
  );
  const RatePerHour = Format.dollarsPerPeriod("hourly").toFixed(2);

  const {
    total_OtHours,
    total_hours,
    average_hoursPerWeek,
    average_OtHoursPerWeek,
    shouldBe_RatePerHour,
    shouldBe_salary,
    actual_RatePerHour,
  } = getAverages();

  const hoursInAWorkWeek = 40;

  const pctChange_shouldBe_RatePerHour = {
    pos: Number(shouldBe_RatePerHour) >= Number(RatePerHour),
  };
  const pctChange_actual_RatePerHour = {
    pos: Number(actual_RatePerHour) >= Number(RatePerHour),
  };
  const pctChange_average_hoursPerWeek = {
    pos: Number(average_hoursPerWeek) >= Number(hoursInAWorkWeek),
  };
  const pctChange_average_hoursLastWeek = {
    pos: Number(hoursLastWeek) >= Number(hoursInAWorkWeek),
  };

  pctChange_shouldBe_RatePerHour.pct = pctChange_shouldBe_RatePerHour.pos
    ? (Number(shouldBe_RatePerHour) / Number(RatePerHour) - 1) * 100
    : (Number(RatePerHour) / Number(shouldBe_RatePerHour) - 1) * 100;

  pctChange_actual_RatePerHour.pct = pctChange_actual_RatePerHour.pos
    ? (Number(actual_RatePerHour) / Number(RatePerHour) - 1) * 100
    : (Number(RatePerHour) / Number(actual_RatePerHour) - 1) * 100;

  pctChange_average_hoursPerWeek.pct = pctChange_average_hoursPerWeek.pos
    ? (Number(average_hoursPerWeek) / Number(hoursInAWorkWeek) - 1) * 100
    : (Number(hoursInAWorkWeek) / Number(average_hoursPerWeek) - 1) * 100;

  pctChange_average_hoursLastWeek.pct = pctChange_average_hoursLastWeek.pos
    ? (Number(hoursLastWeek) / Number(hoursInAWorkWeek) - 1) * 100
    : (Number(hoursInAWorkWeek) / Number(hoursLastWeek) - 1) * 100;

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
          Hours {render_sectionDetail("This Week")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {hoursThisWeek}
        </Text>
      </View>

      {/* Hours last week */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Hours {render_sectionDetail("Last Week")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {render_percentChangeText({
            pos: pctChange_average_hoursLastWeek.pos,
            pct: pctChange_average_hoursLastWeek.pct,
            prs: 1,
            fixed: false,
          })}
          {hoursLastWeek}
        </Text>
      </View>

      {/* YTD Hours */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Hours {render_sectionDetail("Year To Date")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {total_hours}
        </Text>
      </View>

      {/* Avg Hours per week */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Hours / Week {render_sectionDetail("Average")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {render_percentChangeText({
            pos: pctChange_average_hoursPerWeek.pos,
            pct: pctChange_average_hoursPerWeek.pct,
            prs: 1,
            fixed: false,
          })}
          {average_hoursPerWeek}
        </Text>
      </View>

      {/* YTD OT */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          OT {render_sectionDetail("Year To Date")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {total_OtHours}
        </Text>
      </View>

      {/* //BUG  with result compared to avg hours per week */}
      {/* Average OT / Week */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          OT / Week {render_sectionDetail("Average")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {average_OtHoursPerWeek}
        </Text>
      </View>

      {/* $/h */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Rate / Hour {render_sectionDetail("Current")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {privacyMode ? " -" : "$" + RatePerHour}
        </Text>
      </View>

      {/* Should-be $/h */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Rate / Hour {render_sectionDetail("Should-be")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {render_percentChangeText({
            pos: pctChange_shouldBe_RatePerHour.pos,
            pct: pctChange_shouldBe_RatePerHour.pct,
            prs: 1,
            fixed: false,
          })}
          {privacyMode ? " -" : "$" + shouldBe_RatePerHour}
        </Text>
      </View>

      {/* Actual $/h */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Rate / Hour {render_sectionDetail("True")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {render_percentChangeText({
            pos: pctChange_actual_RatePerHour.pos,
            pct: pctChange_actual_RatePerHour.pct,
            prs: 1,
            fixed: false,
          })}
          {privacyMode ? " -" : "$" + actual_RatePerHour}
        </Text>
      </View>

      {/* salary */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Rate / Year {render_sectionDetail("Current")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {privacyMode
            ? " -"
            : "$" + Number(RatePerYear).toLocaleString("en-US")}
        </Text>
      </View>

      {/* Should-be salary */}
      <View style={styles.row}>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col1]}>
          Rate / Year {render_sectionDetail("Should-be")}
        </Text>
        <Text style={[gStyles.text_white, gStyles.text_small, styles.col2]}>
          {privacyMode
            ? " -"
            : "$" + Number(shouldBe_salary).toLocaleString("en-US")}
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

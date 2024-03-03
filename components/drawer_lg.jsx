import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import gStyles from "../styles/globalStyle";
import {
  dateObj_ToMillis,
  millis_toMonthAndDayStrings,
  millis_toSecondsMinutesHoursString,
  timeArrays,
} from "../js/utils/format.js";
import { icons } from "../js/utils/icons.js";
import { Picker } from "@react-native-picker/picker";
import Store from "../js/Store/store.js";
import { handleSubscription_drawer } from "../js/pageFuncs/subscriptions";
import {
  master_addEntry,
  master_deleteEntry,
  master_editEntry,
} from "../js/pageFuncs/home";
import { set_settings } from "../js/Store/data.js";
import Stats from "./stats";

const now = new Date();

export default ({ pockets, setPockets }) => {
  const [addHoursValues, setAddHoursValues] = useImmer({
    start: {
      date: {
        month: now.getMonth(),
        day: now.getDate(),
      },
      time: {
        hour: now.getHours() > 11 ? now.getHours() - 12 : now.getHours(),
        minute: now.getMinutes(),
        ampm: now.getHours() > 11 ? "pm" : "am",
      },
    },
    end: {
      time: {
        hour: now.getHours() > 11 ? now.getHours() - 12 : now.getHours(),
        minute: now.getMinutes(),
        ampm: now.getHours() > 11 ? "pm" : "am",
      },
    },
  });
  const [hoursArr, setHoursArr] = useState([]);

  const bus = {
    addHoursValues,
    setAddHoursValues,
    pockets,
    setPockets,
    hoursArr,
    setHoursArr,
  };

  const hoursDynamicStyle = pockets.hours.open ? { flex: 1 } : {};
  const statsDynamicStyle = pockets.stats.open ? { flex: 1 } : {};

  const selectedColor = "orange";

  const textColor = {
    view: pockets.hours.navigation === "view" ? selectedColor : "gray",
    add: pockets.hours.navigation === "add" ? selectedColor : "gray",
    edit: pockets.hours.navigation === "edit" ? selectedColor : "gray",
    delete: pockets.hours.navigation === "delete" ? selectedColor : "gray",
  };

  useEffect(() => {
    console.log(
      "drawer_lg userEffect - setting hours array: ",
      Store.getState().data.dataArray
    );
    setHoursArr(Store.getState().data.dataArray);
    load({ setPockets });
    Store.subscribe(() => handleSubscription_drawer({ setHoursArr }));
  }, []);

  return (
    <View style={styles.innerContainer_content}>
      {/* Hours */}
      <View style={[styles.pocketContainer, hoursDynamicStyle]}>
        <Pressable
          style={styles.pocketHeader_container}
          onPress={() => press_changeTabSection("hours", setPockets, pockets)}
        >
          <Text style={[styles.pocketHeader, gStyles.text_small]}>Hours</Text>
        </Pressable>
        <View style={[styles.pocketBody]}>
          <View style={styles.hoursContainer}>
            <View style={styles.navigation_container}>
              <Pressable
                style={[styles.navigation_button]}
                onPress={() => press_navigation("view", bus.setPockets)}
              >
                <Text style={[gStyles.text_xSmall, { color: textColor.view }]}>
                  View
                </Text>
              </Pressable>
              <Pressable
                style={styles.navigation_button}
                onPress={() => press_navigation("add", bus.setPockets)}
              >
                <Text style={[gStyles.text_xSmall, { color: textColor.add }]}>
                  Add
                </Text>
              </Pressable>
              <Pressable
                style={styles.navigation_button}
                onPress={() => press_navigation("edit", bus.setPockets)}
              >
                <Text style={[gStyles.text_xSmall, { color: textColor.edit }]}>
                  Edit
                </Text>
              </Pressable>
              <Pressable
                style={styles.navigation_button}
                onPress={() => press_navigation("delete", bus.setPockets)}
              >
                <Text
                  style={[gStyles.text_xSmall, { color: textColor.delete }]}
                >
                  Delete
                </Text>
              </Pressable>
            </View>
            <ScrollView style={styles.hoursScroll}>
              {pockets.hours.loading
                ? render_loading_hoursSection()
                : render_hoursSection(bus)}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.pocketContainer, statsDynamicStyle]}>
        <Pressable
          style={styles.pocketHeader_container}
          onPress={() => press_changeTabSection("stats", setPockets, pockets)}
        >
          <Text style={[styles.pocketHeader, gStyles.text_small]}>Stats</Text>
        </Pressable>
        <View style={[styles.pocketBody]}>
          {pockets.stats.loading
            ? render_loading_statsSection()
            : render_statsSection(bus)}
        </View>
      </View>
    </View>
  );
};

/*    Render    */
function render_loading_hoursSection() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={[gStyles.text_small, gStyles.text_white]}>Loading ... </Text>
    </View>
  );
}
function render_loading_statsSection() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={[gStyles.text_small, gStyles.text_white]}>Loading ... </Text>
    </View>
  );
}
function render_hoursSection({
  pockets,
  setPockets,
  addHoursValues,
  setAddHoursValues,
  hoursArr,
  setHoursArr,
}) {
  const render_icon = (index, item) => {
    const nav = pockets.hours.navigation;
    const selected = pockets.hours.selected;

    if ((nav !== "edit" || nav !== "delete") && selected !== index)
      return <View />;

    const wrench = {
      // @ts-ignore
      uri: icons.WrenchIcon,
      bgColor: "chocolate",
    };

    const trash = {
      // @ts-ignore
      uri: icons.TrashIcon,
      bgColor: "#b01c1c",
    };

    const icon = nav === "edit" ? wrench : trash;

    return (
      <Pressable
        style={[
          styles.hoursItem_actionButtonContainer,
          { backgroundColor: icon.bgColor },
        ]}
        onPress={() =>
          press_icon({ index, item, pockets, setPockets, setAddHoursValues })
        }
      >
        <Image
          style={styles.hoursItem_icon}
          // @ts-ignore
          source={icon.uri}
        ></Image>
      </Pressable>
    );
  };
  const render_addOrModifyItem = () => {
    const dayCount = timeArrays.daysInMonths[addHoursValues.start.date.month];

    const daysInMonth = Array.from({ length: dayCount }, (_, i) => i + 1);
    const hoursInDay = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutesInHour = Array.from({ length: 60 }, (_, i) => i);

    return (
      <View style={styles.hours_addItem_container}>
        <Text style={styles.hours_addItem_header}>
          {pockets.hours.edit >= 0 ? "Edit" : "Add"} Hours
        </Text>

        {/* Date */}
        <View style={[styles.hours_addItem_sectionContainer]}>
          <Text style={styles.hours_addItem_sectionText}>Date:</Text>
          <Picker
            style={{
              color: "orange",
              width: 140,
            }}
            mode={"dropdown"}
            numberOfLines={1}
            dropdownIconColor={"white"}
            selectedValue={addHoursValues.start.date.month}
            onValueChange={(itemValue, itemIndex) =>
              setAddHoursValues((draft) => {
                draft.start.date.month = itemValue;
              })
            }
          >
            <Picker.Item label="January" value={0} />
            <Picker.Item label="Febuary" value={1} />
            <Picker.Item label="March" value={2} />
            <Picker.Item label="April" value={3} />
            <Picker.Item label="May" value={4} />
            <Picker.Item label="June" value={5} />
            <Picker.Item label="July" value={6} />
            <Picker.Item label="August" value={7} />
            <Picker.Item label="September" value={8} />
            <Picker.Item label="October" value={9} />
            <Picker.Item label="November" value={10} />
            <Picker.Item label="December" value={11} />
          </Picker>
          <Picker
            style={{
              color: "orange",
              width: 100,
            }}
            itemStyle={{
              backgroundColor: "green",
              width: 10,
              padding: 0,
            }}
            mode={"dropdown"}
            dropdownIconColor={"white"}
            selectedValue={addHoursValues.start.date.day}
            onValueChange={(itemValue, itemIndex) =>
              setAddHoursValues((draft) => {
                draft.start.date.day = itemValue;
              })
            }
          >
            {daysInMonth.map((item, index) => {
              return (
                <Picker.Item key={index} label={item.toString()} value={item} />
              );
            })}
          </Picker>
        </View>

        {/* Start Time */}
        <View style={styles.hours_addItem_sectionContainer}>
          <Text style={styles.hours_addItem_sectionText}>Start Time:</Text>
          <Picker
            style={{
              color: "orange",
              width: 95,
            }}
            itemStyle={{
              padding: 0,
            }}
            mode={"dropdown"}
            dropdownIconColor={"white"}
            selectedValue={addHoursValues.start.time.hour}
            onValueChange={(itemValue, itemIndex) =>
              setAddHoursValues((draft) => {
                draft.start.time.hour = itemValue;
              })
            }
          >
            {hoursInDay.map((item, index) => {
              return (
                <Picker.Item key={index} label={item.toString()} value={item} />
              );
            })}
          </Picker>
          <Picker
            style={{
              color: "orange",
              width: 100,
            }}
            itemStyle={{
              padding: 0,
            }}
            mode={"dropdown"}
            dropdownIconColor={"white"}
            selectedValue={addHoursValues.start.time.minute}
            onValueChange={(itemValue, itemIndex) =>
              setAddHoursValues((draft) => {
                draft.start.time.minute = itemValue;
              })
            }
          >
            {minutesInHour.map((item, index) => {
              return (
                <Picker.Item
                  key={index}
                  label={new Intl.NumberFormat(undefined, {
                    minimumIntegerDigits: 2,
                  }).format(item)}
                  value={item}
                />
              );
            })}
          </Picker>
          <Picker
            style={{
              color: "orange",
              width: 100,
            }}
            itemStyle={{
              padding: 0,
            }}
            mode={"dropdown"}
            dropdownIconColor={"white"}
            selectedValue={addHoursValues.start.time.ampm}
            onValueChange={(itemValue, itemIndex) =>
              setAddHoursValues((draft) => {
                draft.start.time.ampm = itemValue;
              })
            }
          >
            <Picker.Item label={"AM"} value={"am"} />
            <Picker.Item label={"PM"} value={"pm"} />
          </Picker>
        </View>

        {/* End Time */}
        <View style={styles.hours_addItem_sectionContainer}>
          <Text style={styles.hours_addItem_sectionText}>End Time:</Text>
          <Picker
            style={{
              color: "orange",
              width: 95,
            }}
            itemStyle={{
              padding: 0,
            }}
            mode={"dropdown"}
            dropdownIconColor={"white"}
            selectedValue={addHoursValues.end.time.hour}
            onValueChange={(itemValue, itemIndex) =>
              setAddHoursValues((draft) => {
                draft.end.time.hour = itemValue;
              })
            }
          >
            {hoursInDay.map((item, index) => {
              return (
                <Picker.Item key={index} label={item.toString()} value={item} />
              );
            })}
          </Picker>
          <Picker
            style={{
              color: "orange",
              width: 100,
            }}
            itemStyle={{
              padding: 0,
            }}
            mode={"dropdown"}
            dropdownIconColor={"white"}
            selectedValue={addHoursValues.end.time.minute}
            onValueChange={(itemValue, itemIndex) =>
              setAddHoursValues((draft) => {
                draft.end.time.minute = itemValue;
              })
            }
          >
            {minutesInHour.map((item, index) => {
              return (
                <Picker.Item
                  key={index}
                  label={new Intl.NumberFormat(undefined, {
                    minimumIntegerDigits: 2,
                  }).format(item)}
                  value={item}
                />
              );
            })}
          </Picker>
          <Picker
            style={{
              color: "orange",
              width: 100,
            }}
            itemStyle={{
              padding: 0,
            }}
            mode={"dropdown"}
            dropdownIconColor={"white"}
            selectedValue={addHoursValues.end.time.ampm}
            onValueChange={(itemValue, itemIndex) =>
              setAddHoursValues((draft) => {
                draft.end.time.ampm = itemValue;
              })
            }
          >
            <Picker.Item label={"AM"} value={"am"} />
            <Picker.Item label={"PM"} value={"pm"} />
          </Picker>
        </View>

        {/* Submit  */}
        <View style={{ width: "100%", flexDirection: "row" }}>
          <Pressable
            style={[
              styles.hours_addItem_submitButtonContainer,
              { marginRight: 10, flex: 2 },
            ]}
            onPress={() =>
              press_submit_addOrModifyItem(pockets, setPockets, addHoursValues)
            }
          >
            <Text
              style={[
                styles.hours_addItem_submitButtonText,
                gStyles.text_medium,
              ]}
            >
              {pockets.hours.edit >= 0 ? "Update" : "Submit"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.hours_addItem_submitButtonContainer, { flex: 1 }]}
            onPress={() =>
              pockets.hours.edit >= 0
                ? press_cancel_addOrModifyItem(setPockets, setAddHoursValues)
                : press_clear_addOrModifyItem(setAddHoursValues)
            }
          >
            <Text
              style={[
                styles.hours_addItem_cancelButtonText,
                gStyles.text_medium,
                gStyles.text_chocolate,
                gStyles.border_chocolate,
              ]}
            >
              {pockets.hours.edit >= 0 ? "Cancel" : "Reset"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };
  const render_allHourItems = () => {
    return hoursArr.map((item, index) => {
      const { date, day } = millis_toMonthAndDayStrings(item.Start);
      const diff = Number(item.End) - Number(item.Start);

      const hours = millis_toSecondsMinutesHoursString(diff, { trim: false });

      const sel = pockets.hours.selected;
      return (
        <Pressable
          key={index}
          style={[
            styles.hoursItem,
            { paddingVertical: sel === index ? 10 : 5 },
          ]}
          onPress={() => press_hourItem(index, pockets, setPockets)}
        >
          <Text
            style={[
              styles.hoursItem_text,
              { flex: 1, color: sel === index ? "orange" : "white" },
            ]}
          >
            {day}
          </Text>
          <Text
            style={[
              styles.hoursItem_text,
              { flex: 1, color: sel === index ? "orange" : "white" },
            ]}
          >
            {date}
          </Text>
          <Text
            style={[
              styles.hoursItem_text,
              {
                flex: 1.5,
                color: sel === index ? "orange" : "white",
              },
            ]}
          >
            {hours}
          </Text>
          {render_icon(index, item)}
        </Pressable>
      );
    });
  };

  if (
    pockets.hours.navigation === "add" ||
    (pockets.hours.navigation === "edit" && pockets.hours.edit >= 0)
  )
    return render_addOrModifyItem();
  else return render_allHourItems();
}
function render_statsSection({ pockets, setPockets }) {
  return (
    <View style={styles.statsContainer}>
      <Stats pockets={pockets} setPockets={setPockets} />
    </View>
  );
}

/*    Utilities    */
async function load({ setPockets }) {
  const state = Store.getState();

  const settings = state.data.settings;

  setup_hours({ setPockets, data: state.data.dataArray });
  setup_state({ setPockets });
}
function setup_hours({ setPockets, data }) {
  setPockets((draft) => {
    draft.hours.loading = false;
  });
}
function setup_state({ setPockets }) {
  setPockets((draft) => {
    draft.stats.loading = false;
  });
}

/*    OnPress    */
function press_changeTabSection(newTab, setPockets, pockets) {
  const key = newTab === "hours" ? "hoursTab_open" : "statsTab_open";
  const value = !pockets[newTab].open;

  Store.dispatch(set_settings({ [key]: value }));

  // Settings are saved in subscription in home.js @ handle_subscription() after dispatch

  setPockets((draft) => {
    draft[newTab].open = value;
    if (newTab === "stats" && !value) draft.stats.selected = null;
  });
}
function press_navigation(selection, setPockets) {
  setPockets((draft) => {
    draft.hours.navigation = selection;
    if (selection === "add" || selection === "view")
      draft.hours.selected = null;
  });
}
function press_hourItem(i, pockets, setPockets) {
  const getIndex = (nav, p, _i) => {
    return p[nav].selected === null ? _i : p[nav].selected === _i ? null : _i;
  };

  // navigation ---> 'view' || 'edit' || 'delete'
  const cat = pockets.hours.navigation === "view" ? "stats" : "hours";

  setPockets((draft) => {
    draft[cat].selected = getIndex(cat, pockets, i);
  });
}
function press_icon({ index, item, pockets, setPockets, setAddHoursValues }) {
  const nav = pockets.hours.navigation;

  if (nav === "delete") {
    Alert.alert(
      "Delete Time",
      "Are you sure you want to delete this entry?",
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "I'm Sure",
          onPress: () => press_deleteEntry({ index, item, setPockets }),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {},
      }
    );
  } else if (nav === "edit") {
    const d_start = new Date(item.Start);
    const d_end = new Date(item.End);

    setAddHoursValues((draft) => {
      draft.start = {
        date: {
          month: d_start.getMonth(),
          day: d_start.getDate(),
        },
        time: {
          hour:
            d_start.getHours() > 11
              ? d_start.getHours() - 12
              : d_start.getHours(),
          minute: d_start.getMinutes(),
          ampm: d_start.getHours() > 11 ? "pm" : "am",
        },
      };
      draft.end = {
        date: {
          month: d_end.getMonth(),
          day: d_end.getDate(),
        },
        time: {
          hour:
            d_end.getHours() > 11 ? d_end.getHours() - 12 : d_end.getHours(),
          minute: d_end.getMinutes(),
          ampm: d_end.getHours() > 11 ? "pm" : "am",
        },
      };
    });
    setPockets((draft) => {
      draft.hours.edit = item.Id;
    });
  }
}
async function press_submit_addOrModifyItem(
  pockets,
  setPockets,
  addHoursValues
) {
  const s = addHoursValues.start;
  const e = addHoursValues.end;

  // BUG --- Potential bug. Set to dynamic year
  const startTimeObj = {
    year: new Date().getFullYear(),
    month: s.date.month,
    day: s.date.day,
    hour: s.time.hour,
    minute: s.time.minute,
    ampm: s.time.ampm,
  };
  const endTimeObj = {
    year: new Date().getFullYear(),
    month: s.date.month,
    day: s.date.day,
    hour: e.time.hour,
    minute: e.time.minute,
    ampm: e.time.ampm,
  };

  const startTime = dateObj_ToMillis(startTimeObj);
  const endTime = dateObj_ToMillis(endTimeObj);

  if (Date.now() < startTime) {
    return alert("Adding future times is rejected.");
  }

  try {
    // If editing hours
    if (pockets.hours.edit >= 0)
      await master_editEntry({ startTime, endTime, pockets, setPockets }).then(
        (res) => {
          alert("Edit sucessful");
        }
      );
    // If adding new item
    else
      await master_addEntry({ startTime, endTime, pockets, setPockets }).then(
        (res) => {
          alert("Sucessfully added new entry");
        }
      );
  } catch (e) {
    console.error(e);
    console.error("Caught error @ press_submit_addOrModifyItem()");
    alert("Failed to save time");
  }
}
function press_cancel_addOrModifyItem(setPockets, setAddHoursValues) {
  setPockets((draft) => {
    draft.hours.edit = -1;
  });
  press_clear_addOrModifyItem(setAddHoursValues);
}
function press_clear_addOrModifyItem(setAddHoursValues) {
  const now = new Date();
  setAddHoursValues({
    start: {
      date: {
        month: now.getMonth(),
        day: now.getDate(),
      },
      time: {
        hour: now.getHours() > 11 ? now.getHours() - 12 : now.getHours(),
        minute: now.getMinutes(),
        ampm: now.getHours() > 11 ? "pm" : "am",
      },
    },
    end: {
      time: {
        hour: now.getHours() > 11 ? now.getHours() - 12 : now.getHours(),
        minute: now.getMinutes(),
        ampm: now.getHours() > 11 ? "pm" : "am",
      },
    },
  });
}
async function press_deleteEntry(args) {
  await master_deleteEntry(args)
    .then(() => {
      alert("Sucessfully deleted entry");
    })
    .catch((e) => {
      alert("Failed to delete entry");
      console.log(" ");
      console.error("Error @ press_deleteEntry: ", e);
      console.log(" ");
    });
}

const styles = StyleSheet.create({
  innerContainer_content: {
    // paddingTop: 5,
    flex: 1,
    // borderWidth: 1,
    // borderColor: "black",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  pocketContainer: {
    marginVertical: 2,
    marginHorizontal: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "hsla(0, 0%, 0%, 0.78)",
    // borderWidth: 1,
    // borderColor: "yellow",
  },
  pocketHeader_container: {
    // backgroundColor: "orange",
    alignItems: "center",
  },
  pocketHeader: {
    color: "white",
    paddingVertical: 10,
  },
  pocketBody: {
    // backgroundColor: "green",
    flex: 1,
  },
  hoursContainer: {
    // backgroundColor: "pink",
    flex: 1,
  },
  hoursScroll: {
    // backgroundColor: "red",
    paddingHorizontal: 5,
  },
  navigation_container: {
    // flex: 1,
    // backgroundColor: "green",
    flexDirection: "row",
    marginHorizontal: 5,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "gray",
  },
  navigation_button: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    // borderWidth: 1,
    // borderColor: "white",
  },
  navigation_text: {
    color: "gray",
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 5,
  },
  statsText: {
    color: "white",
  },
  hoursItem: {
    // backgroundColor: "green",
    flexDirection: "row",
    alignItems: "center",
    // paddingVertical: 5,
    paddingLeft: 10,
  },
  hoursItem_text: {
    fontSize: 18,
    // borderWidth: 1,
    // borderColor: "green",
  },
  hoursItem_actionButtonContainer: {
    // backgroundColor: "purple",
    alignItems: "center",
    marginRight: 15,
    padding: 2,
    borderRadius: 5,
  },
  hoursItem_icon: {
    height: 20,
    width: 20,
    // tintColor: "chocolate",
    // backgroundColor: "green",
  },
  hours_addItem_container: {
    // backgroundColor: "red",
    flex: 1,
    paddingHorizontal: 10,
  },
  hours_addItem_header: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
    marginTop: 20,
  },
  hours_addItem_sectionContainer: {
    // backgroundColor: "green",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderBottomWidth: 1,
    borderColor: "white",
    marginVertical: 20,
    // backgroundColor: "hsla(0, 0%, 0%, 0.5)",
  },
  hours_addItem_sectionText: {
    width: 100,
    color: "gray",
    fontSize: 12,
    // backgroundColor: "cyan",
    textAlign: "left",
    position: "absolute",
    bottom: 2,
    left: 10,
    // left: "50%",
    // transform: [{ translateX: -50 }],
  },
  hours_addItem_sectionInput: {
    color: "orange",
    flex: 1,
    paddingTop: 12,
    // backgroundColor: "blue",
    textAlign: "center",
  },
  hours_addItem_submitButtonContainer: {
    // width: "100%",
    paddingVertical: 30,
  },
  hours_addItem_submitButtonText: {
    backgroundColor: "chocolate",
    color: "black",
    textAlign: "center",
    paddingVertical: 10,
  },
  hours_addItem_cancelButtonText: {
    color: "chocolate",
    textAlign: "center",
    fontSize: 25,
    paddingVertical: 10,
  },
});

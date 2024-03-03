import * as db from "./database.js"
import { Alert } from 'react-native'
import * as Format from './format.js'
import Store from '../Store/store.js'

export let intervalTickerFuncRef = -1
export let lastValues = { start: -1, end: -1 }

export async function initialize() {
  const clearExtraActiveClocks = (arr) => {
    return new Promise(async (resolve, reject) => {
      const prompt = (dataEntry, len) => {
        const deleteThisClockMultiple = async (id, resolve) => {
          if (await db.delete_withId(id)) resolve(true);
          else {
            alert("Failed to delete entry");
            resolve(false);
          }
        };
        return new Promise((resolve2, reject) => {
          const s = Format.millis_ToDateObj(dataEntry.Start);
          const month = s.month + 1;
          const hour = Format.hoursMilitary_ToStandardWithAmPm(s.hour);
          const string =
            month +
            "/" +
            s.date +
            " at " +
            hour.hour +
            ":" +
            s.minute +
            hour.ampm;

          Alert.alert(
            "(" + len + ") active clocks, there can only be 1!!!",
            "Would you like to delete: " + string,
            [
              {
                text: "Yes",
                onPress: () =>
                  deleteThisClockMultiple(dataEntry.Id, resolve2),
              },
              {
                text: "No",
                onPress: () => {
                  resolve2(false);
                },
              },
            ],
            {
              cancelable: false,
            }
          );
        });
      };

      if (arr.length > 1) console.log("arr: ", arr);

      let i = 0;

      if (arr.length <= 1)
        resolve({
          modified: false,
          id: -1,
          start: -1,
        });
      else {
        while (arr.length > 1) {
          console.error("Clearing active clocks .... len:", arr);
          if (await prompt(arr[i], arr.length)) arr.splice(i, 1);
          else i = i + 1 >= arr.length ? 0 : i + 1;
        }
        if (arr.length >= 0) {
          await prompt(arr[i], arr.length);
        }
        resolve({
          modified: true,
          id: arr.length > 0 ? arr[0].Id : -1,
          start: arr.length > 0 ? arr[0].Start : -1,
        });
      }
    });
  }

  try {
    const precheck_ActiveClock = await db.getData_LastEntryWithoutEndTime()
    const modified_ActiveClock = await clearExtraActiveClocks(
      precheck_ActiveClock.conflictArr
    );

    const { id, start } = modified_ActiveClock.modified
      ? modified_ActiveClock
      : precheck_ActiveClock;

    const active = id >= 0

    return { success: true, clock: { currentItem: id, activeClockStartTime_millis: start, active } }
  } catch (e) {
    console.error(e)
    console.error('Failed to initialize clock! ' + e.message)
    return { success: false, clock: { currentItem: -1, activeClockStartTime_millis: -1, active: false } }
  }
}

export function differenceOfMillis_toSecondsMinutesHours({ start, end }) {
  const difference = end - start

  const millis_inHours = 1000 * 60 * 60
  const millis_inMinutes = 1000 * 60
  const millis_inSeconds = 1000

  const hoursRemainder = difference % millis_inHours
  const hours = (difference - hoursRemainder) / millis_inHours
  const minutesRemainder = hoursRemainder % millis_inMinutes
  const minutes = (hoursRemainder - minutesRemainder) / millis_inMinutes
  const secondsRemainder = minutesRemainder % millis_inSeconds
  const seconds = (minutesRemainder - secondsRemainder) / millis_inSeconds

  return { seconds, minutes, hours }
}

export const sortDatabaseArray_newestStartTimesToOldest = array => {
  if (array.length <= 1) return array

  let sortedArr = []

  array.forEach(element => {
    if (sortedArr.length < 1) sortedArr.push(element)
    else {

      let pushToIndex = -1

      for (let i = 0; i < sortedArr.length; i++) {
        if (element.Start <= sortedArr[i].Start) continue
        else if (element.Start > sortedArr[i].Start && pushToIndex === -1) pushToIndex = i
      }
      if (pushToIndex === -1) sortedArr.splice(sortedArr.length, 0, element)
      else sortedArr.splice(pushToIndex, 0, element)
    }
  });

  return sortedArr
}

export const whereToInsertIntoDbArr = ({ dbArray, number }) => {
  if (dbArray.length < 1) return 0


  const index = dbArray.findIndex(item => number >= item.Start)

  if (index >= 0) return index
  else return dbArray.length
}

export const filterDatabase_WeekSegment_givenFlag = (flag_millis) => {
  const getHowManyDaysToRemove = ({ beginningOfPeriod_dayIndex, flag }) => {
    const currentDayIndex = flag.getDay()
    //         6       >           1
    if (currentDayIndex > beginningOfPeriod_dayIndex)
      return (
        //      6       - (      6         -           1               )
        currentDayIndex - beginningOfPeriod_dayIndex
      );
    else if (currentDayIndex < beginningOfPeriod_dayIndex)
      return 7 - beginningOfPeriod_dayIndex + currentDayIndex;
    else return 0;
  };

  const state = Store.getState().data
  const workWeekStart = state.settings.workWeekStart
  const databaseArray = state.dataArray
  const flag = new Date(flag_millis)

  const timeOfDay_millis = getTimeOfDay_millis(flag);
  const daysToRemove_days = getHowManyDaysToRemove({ beginningOfPeriod_dayIndex: workWeekStart, flag })
  const oneDayToMillis = 1 * 24 * 60 * 60 * 1000;
  const daysToRemove_millis = oneDayToMillis * daysToRemove_days;
  const millisToRemove = daysToRemove_millis + timeOfDay_millis - 1

  const beginningOfWeek_millis = flag.getTime() - millisToRemove
  const endOfWeek_millis = (7 * oneDayToMillis) + beginningOfWeek_millis

  const array = databaseArray.filter(item => {
    return item.Start >= beginningOfWeek_millis && item.Start < endOfWeek_millis
  }
  )

  return { beginningOfWeek_millis, endOfWeek_millis, array }
}

export const getTimeOfDay_millis = (flag) => {
  // flag = new Date()
  const currentHours = flag.getHours();
  const currentMinutes = flag.getMinutes();
  const currentSeconds = flag.getSeconds();

  const currentSeconds_ToMillis = currentSeconds * 1000;
  const currentMinutes_ToMillis = currentMinutes * 60 * 1000;
  const currentHours_ToMillis = currentHours * 60 * 60 * 1000;

  return (
    currentSeconds_ToMillis +
    currentMinutes_ToMillis +
    currentHours_ToMillis
  );
}

export const findHourlyEquivalent_factoringOt_OneWeek = (array) => {
  const dollarsPerWeek = Format.dollarsPerPeriod('weekly')

  const { minutes, hours } = Format.millis_toSecondsMinutesHours(
    array.reduce(
      (total, curr) => total + (Number(curr.End) - Number(curr.Start)),
      0
    )
  );
  const hoursThisWeek = hours + minutes / 60;

  if (hoursThisWeek <= 40) return dollarsPerWeek / hoursThisWeek
  else {
    const ot = hoursThisWeek - 40
    return dollarsPerWeek / (40 + (1.5 * ot))
  }
}

export const getTotalWeeklyHours = (flag_millis) => {
  const { beginningOfWeek_millis, endOfWeek_millis, array } =
    filterDatabase_WeekSegment_givenFlag(flag_millis);
  const { hours, minutes } = Format.millis_toSecondsMinutesHours(array.reduce(
    (total, current) => total + current.End - current.Start,
    0
  ))

  const total = hours + (minutes / 60)
  return { start: beginningOfWeek_millis, end: endOfWeek_millis, total }
}

// TODO factor holidays, PTO, sick days here
export const getAveragesYtd = () => {
  const rangeStart = Store.getState().data.settings.averagesRangeStart
  const rangeEnd = Store.getState().data.settings.averagesRangeEnd
  const statsArr = []
  const flag_end = rangeEnd === 'current' ? Date.now() : rangeEnd
  let flag_start = rangeStart

  while (flag_start <= flag_end) {
    flag_start = statsArr[statsArr.push(getTotalWeeklyHours(flag_start)) - 1].end + 1000
  }

  // getter is finding dates before beginning of year, maybe not an issue
  // getter is finding dates in range from friday - friday, i think ? 

  // console.log('***** statsArr: ', statsArr)
  return statsArr
}

export const updateClockOnAppRestored = ({ setTicker, AppState }) => {
  if (AppState.currentState !== "active") return

  console.log("App Resumed!!!! ");
  const clock = Store.getState().ui.clock
  if (clock.activeClockStartTime_millis < 0) return

  const startTime = clock.activeClockStartTime_millis
  const currentTime = Date.now()
  setTicker(Format.millis_toSecondsMinutesHours(currentTime - startTime))
}





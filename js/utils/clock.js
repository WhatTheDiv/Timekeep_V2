import * as db from "../utils/database"
import { Alert } from 'react-native'
import * as format from './format'

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
          const s = format.millis_ToDateObj(dataEntry.Start);
          const month = s.month + 1;
          const hour = format.hoursMilitary_ToStandardWithAmPm(s.hour);
          const string =
            month +
            "/" +
            s.day +
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




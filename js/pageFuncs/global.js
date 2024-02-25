import Store from "../Store/store.js";
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'
import { delete_everythingFromDatabase, getData_totalLengthOfDatabase } from "../utils/database.js";
import { reset_ui, set_clock } from "../Store/ui.js";
import { reset_setup } from "../Store/setup.js";
import { reset_data, set_settings } from "../Store/data.js";

export function check_OutOfOrder() {
  const state = Store.getState().setup

  const notInitialized = !state.setup || !state.hasUserData

  // If not initialized, return true
  return notInitialized
}

export const delete_SettingsAndUserData = async () => {
  await AsyncStorage.multiRemove(['user-name', 'salary', 'settings'])

  Store.dispatch(reset_ui({}))
  Store.dispatch(reset_setup({}))
  Store.dispatch(reset_data({}))

}

export const delete_AllDatabase = async () => {
  const result = await new Promise(async (resolve, reject) => {
    const len = await getData_totalLengthOfDatabase()
    Alert.alert(
      'Delete Everything',
      'Are you sure you want to delete all (' + len + ') items stored in the database ?',
      [
        {
          text: 'No',
          onPress: () => resolve(false)
        },
        {
          text: 'Yes',
          onPress: () => resolve(true)
        }
      ],
      { cancelable: false, }
    )
  }).catch(e => {
    console.error('Error deleting everything from database')
    return false
  })

  if (result)
    if (await delete_everythingFromDatabase().then(res => {
      alert('Sucessfully deleted everything from the database')
      return true
    }).catch(e => {
      alert(":'( Failed to delete database :'( ")
      return false
    })) {
      //       If confirmed delete, and delete sucessful...
      // [x] -- Cleanup data
      // activeClockStartTime_millis: -1 ----> helper for clockOut() func in home subscription
      Store.dispatch(set_clock({ active: false, activeClockStartTime_millis: -1 }))
    }
}

export const init_settings = async () => {
  // Get settings object from AsyncStorage
  return await new Promise(async resolve => {
    await AsyncStorage.getItem('settings', async (e, res) => {
      if (res === null || res === undefined) {
        if (e) {
          console.error(e)
          console.error('Failed to get saved settings, getting defaults @ init_settings()')
        }
        const s = Store.getState().data.settings
        if (!await save_settings(s))
          console.error('Failed to save settings @ init_settings()')
        resolve(s)

      }
      else resolve(JSON.parse(res))
    })
  })
}

export const save_settings = async (settingsObject) => {
  return await new Promise(async (resolve) => {
    const JSON_settings = JSON.stringify(settingsObject)
    return await AsyncStorage.setItem('settings', JSON_settings, (e) => {
      if (e) {
        console.error(e)
        console.error('Failed to save settings @ save_settings()')
        resolve(false)
      }
      else resolve(true)
    })
  })
}

export const togglePrivacyMode = () => {
  const pvcy = Store.getState().data.settings.privacy
  console.log('setting privacy mode from ', pvcy, ' to : ', !pvcy)
  Store.dispatch(set_settings({ privacy: !pvcy }))
}







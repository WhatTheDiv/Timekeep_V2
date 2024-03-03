import Store from "../Store/store.js";
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native'
import { delete_everythingFromDatabase, getData_totalLengthOfDatabase } from "../utils/database.js";
import { reset_ui, set_clock } from "../Store/ui.js";
import { reset_setup, set_setup, set_variablesConfigured } from "../Store/setup.js";
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

export const reset_Database = async () => {
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
      alert('Sucessfully cleared the database')
      return true
    }).catch(e => {
      alert(":'( Failed to clear database :'( ")
      return false
    })) {
      //       If confirmed delete, and delete sucessful...
      // activeClockStartTime_millis: -1 ----> helper for clockOut() func in home subscription
      console.log('delete cp')
      Store.dispatch(set_clock({ active: false, activeClockStartTime_millis: -1 }))
      Store.dispatch(set_variablesConfigured({ databaseConfigured: false }))
      Store.dispatch(set_setup({ complete: false }))
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

export const downloadDatabase = async () => {

  const dbIndex = Store.getState().data.settings.dbIndex.toString()
  const root = FileSystem.documentDirectory
  const dir_sqlite = 'SQLite/'
  const fileName_db = 'db' + dbIndex + '.db'
  const db_uri = (root + dir_sqlite + fileName_db)
  // const data = JSON.stringify(Store.getState().data.dataArray)

  try {
    const arr = await FileSystem.readDirectoryAsync(root + dir_sqlite)
    console.log('arr: ', arr)

    const res = await Sharing.shareAsync(db_uri)

    console.log('res: ', res)
  } catch (e) {
    alert('Failed to save database')
    console.log(e)
  }
}

export const importDatabase = async () => {
  try {
    const sqlite_uri = FileSystem.documentDirectory + 'SQLite/'

    // Get all database file names
    const arr = await FileSystem.readDirectoryAsync(sqlite_uri)

    // User select file to import
    const result = await DocumentPicker.getDocumentAsync()

    const dbFile = result.assets && result.assets[0]


    // exit early if no file picked
    if (!dbFile) throw 'No file selected'

    // exit early if database file not picked 
    if (dbFile.name.indexOf('.db') < 0) throw ('wrong file type selected')


    const db_uri = dbFile.uri

    let index = 0

    for (let i = 0; i < arr.length + 1; i++)
      if (arr.indexOf('db' + i.toString() + '.db') === -1)
        index = i

    const filename = 'db' + index + '.db'

    await FileSystem.moveAsync({ from: db_uri, to: sqlite_uri + filename })

    alert('Sucessfully imported ' + dbFile.name)

  } catch (e) {
    alert('failed to import database')
    console.error('Error @ importData: ', e)
  }
}

export const deleteEveryDatabase = async () => {
  try {
    const sqlite_uri = FileSystem.documentDirectory + 'SQLite/'

    // Get all database file names
    const arr = await FileSystem.readDirectoryAsync(sqlite_uri)

    arr.forEach(async item => {
      await FileSystem.deleteAsync(sqlite_uri + item)
    })

    alert('Sucessfully deleted every database')


    Store.dispatch(set_settings({ dbIndex: 0 }))
    Store.dispatch(set_variablesConfigured({ databaseConfigured: false }))
    Store.dispatch(set_setup({ complete: false }))



  } catch (e) {

  }
}

export const switchDatabase = async ({ dbName = -1, newDb = false }) => {
  // XXX
  // set existing database: { dbIndex:currDb }
  // set new database: { newDb:true }
  const getUnusedDbName = async () => {
    const arr = (await FileSystem.readDirectoryAsync(FileSystem.documentDirectory + "SQLite/"))
      .filter((name) => name.indexOf("-journal") === -1)
      .map((item) => Number(item.slice(2, item.indexOf("."))));

    for (let i = 0; i <= arr.length; i++)
      if (arr.indexOf(i) === -1) {
        return i
      }
  }

  if (newDb)
    Store.dispatch(set_settings({ dbIndex: await getUnusedDbName() }))
  else
    Store.dispatch(set_settings({ dbIndex: dbName }))


  Store.dispatch(set_variablesConfigured({ databaseConfigured: false }))
  Store.dispatch(set_setup({ complete: false }))
}







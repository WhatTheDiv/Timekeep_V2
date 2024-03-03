import AsyncStorage from '@react-native-async-storage/async-storage'
import { useDispatch } from 'react-redux'
import { set_variablesConfigured, set_setup } from '../Store/setup.js'
import { set_clock, set_user } from '../Store/ui.js'
import { init_settings } from '../pageFuncs/global'
import { set_dataArray, set_settings } from '../Store/data.js'
import Store from '../Store/store.js'
import * as db from "../utils/database.js"
import * as clock from "../utils/clock.js"
import * as animations from '../animations/mainAnimations'
import { sortDatabaseArray_newestStartTimesToOldest } from '../utils/clock.js'


let _av

export function check_UserData() {
  return new Promise(async (resolve, reject) => {
    try {
      const name = await AsyncStorage.getItem('user-name')
      const salary = await AsyncStorage.getItem('salary')


      if (!name || !salary) resolve({ hasData: false })

      resolve({
        hasData: true, data: { name, salary }
      })

    } catch (e) {
      reject({ message: 'Problem checking for user', error: e.message })
    }
  })
}

export async function set_UserData(form) {
  return new Promise(async (resolve, reject) => {
    try {
      if (form.wage.num.length <= 0) throw new Error('Format - No value given for wage')
      if (form.user_name.length <= 0) throw new Error('Format - No value given for name')
      if (isNaN(form.wage.num)) throw new Error('Format - Enter only numbers for wage')

      const salary = form.wage.period === 'hour' ? form.wage.num * 40 * 52 : form.wage.num

      await AsyncStorage.setItem('user-name', form.user_name)
      await AsyncStorage.setItem('salary', salary.toString())

      resolve({ hasData: true, data: { name: form.user_name, salary } })

    } catch (e) {
      reject({ hasData: false, message: "Problem storing data", error: e.message })
    }
  })
}

export async function set_Store(formData, av) {
  const state = Store.getState()
  const animConfigured = state.setup.animations
  const clockConfigured = state.setup.clock
  const databaseConfigured = state.setup.database

  if (av) _av = av

  // initial configuration of animations, clock, database, data
  if (_av && (!animConfigured || !clockConfigured || !databaseConfigured)) {
    const { _clock, _tailored, _data, _settings } = await configureVariables(_av)
    // ---------------> SET animations, database, clock
    Store.dispatch(set_variablesConfigured({ animationsConfigured: _tailored.animations, clockConfigured: _tailored.clock, databaseConfigured: _tailored.database }))
    // ---------------> SET clockObj
    Store.dispatch(set_clock(_clock))
    // ---------------> SET settings
    if (_settings) Store.dispatch(set_settings(_settings))
    // ---------------> SET data
    Store.dispatch(set_dataArray({ replaceAll: true, data: sortDatabaseArray_newestStartTimesToOldest(_data) }))
  }

  // configure hasUserData
  if (!state.setup.hasUserData) {
    const { hasData, data } = formData === null ? await check_UserData() : await set_UserData(formData)
    // ---------------> SET hasUserData
    Store.dispatch(set_variablesConfigured({ hasUserData: hasData }))
    if (hasData) {
      console.log('Initialized user. ')
      // ---------------> SET userData
      Store.dispatch(set_user(data))
    }
  }

  const newState = Store.getState().setup
  if (newState.animations && newState.database && newState.clock)
    Store.dispatch(set_setup({ complete: true }))
}

async function configureVariables(av) {
  try {

    // Initialize Animations
    const animationsSet = animations.initialize(av)
    console.log('Initialized animations. ')

    // Initialize Settings
    const settings = await init_settings()
    console.log('Initialized settings.')

    // Initialize Database
    const databaseSet = db.init_database({ dbIndex: settings.dbIndex })
    console.log('Initialized database. ')


    // Test Database 
    const end = Date.now() // TODO use settings property 'averagesRangeEnd' for this
    const data = await db.getData_AllBetweenTwoTimes({ start: settings.averagesRangeStart, end })
      .catch(e => {
        console.error('Failed to get data from database')
        return []
      })
    console.log('Initialized data. (', data.length, ') - ', data.length >= 1 ? data[data.length - 1] : '')
    // console.log('all data between ', { start: settings.averagesRangeStart, end }, ': ', data)

    // console.log('all data: ', await db.getData_all())

    // Initialize Clock 
    const clockSet = await clock.initialize()
    console.log('Initialized clock. ')

    return {
      _clock: clockSet.clock,
      _settings: settings,
      _data: data,
      _tailored: {
        animations: animationsSet.success,
        database: databaseSet.success,
        clock: clockSet.success
      }
    }

  } catch (e) {
    console.error('Failed to configure variables')
    console.error(e.message)
    return {
      _clock: { currentItem: -1, activeClockStartTime_millis: -1 },
      _settings: false,
      _data: [],
      _tailored: {
        animations: false,
        database: false,
        clock: false
      }
    }
  }
}
import * as animations from '../animations/mainAnimations'
import * as database from '../utils/database.js'
import { ticker_getTicks, ticker_addOneTick } from '../utils/format.js'
import Store from "../Store/store.js"
import { set_clock } from '../Store/ui.js'
import { delete_withId } from '../utils/database.js'
import { set_dataArray, set_settings } from '../Store/data.js'
import { sortDatabaseArray_newestStartTimesToOldest, whereToInsertIntoDbArr } from '../utils/clock.js'
import { save_settings } from './global'
import AsyncStorage from '@react-native-async-storage/async-storage'


/*   Startup    */
export const startup = ({ setTitle, setTicker }) => {
  const timing = animations.timing

  // Check for active clock
  const activeClock = Store.getState().ui.clock.active

  // Begin phase 1, fade in big button logo
  animations.Startup()

  // Begin phase 2, animate drawer in and move button to final state
  animations.drawer.drawerInitialAnimation({ timing: animations.timing, active: activeClock })

  // Continue phase 2, move big button to its final state
  if (activeClock)
    animations.ClockIn(false, true)
  else
    animations.ClockOut(false, true)

  if (activeClock) {
    setTicker(
      ticker_getTicks(Date.now() - Number(Store.getState().ui.clock.activeClockStartTime_millis))
    )
    Store.dispatch(set_clock({
      intervalTickerFuncRef: setInterval(() => setTicker(prev => ticker_addOneTick(prev)), 1000)
    }))
  }

  // Sets when to remove 'title' from bigButton
  setTimeout(() =>
    setTitle(false),
    timing.changeClockState.duration + timing.changeClockState.delay + timing.startupDelay
  );
}

/*   Subscriptions   */
export async function handle_subscription_home({ setActiveClock, setTicker, pockets, setPockets }) {
  const newState = Store.getState()

  // Initiates master changeClockState func, Working off flag
  if (newState.ui.flag_setClockChanging) {
    Store.dispatch(set_clock({ flag_setClockChanging: false }))
    master_changeClockState({ flag_active: !newState.ui.clock.active, setActiveClock, setTicker, pockets, setPockets })
  }
  // Saves settings in AsyncStorage, Working off flag
  if (newState.data.settingsChanged) {
    await save_settings(newState.data.settings)
    Store.dispatch(set_settings({ reset_settingsChanged: true }))
  }
}
export function handle_subscription_drawer({ setHoursArr }) {
  const newState = Store.getState()

  if (newState.data.dataChanged) {
    Store.dispatch(set_dataArray({ reset_dataChanged: true }))
    console.log('Updating array.')

    // BUG after clock in , clock out, edit does not update this even though newState is correct
    setHoursArr([...newState.data.dataArray])
  }
}


/*   Press Functions   */
export const press_changeClockState = () => {

  // Trigger beginning of of changing clock state
  Store.dispatch(set_clock({ flag_setClockChanging: true }))
}

/*   Master Functions   */
export const master_changeClockState = async ({ flag_active, setActiveClock, setTicker, pockets, setPockets }) => {
  const clock_In = async () => {
    const fallback = {}
    try {
      console.log('# Starting clock ... ')

      // Set animations
      animations.ClockIn()

      // Store timestamp in database 
      const now = Date.now()
      // [x] use master_addEntry()
      console.log('passing to master_addEntry(): ', { now, pockets, setPockets })
      const id = await master_addEntry({ startTime: now, pockets, setPockets }) // ***************************
      fallback.id = id

      // Set & store interval ticker function 
      const intervalTickerFuncRef = setInterval(() => setTicker(prev => ticker_addOneTick(prev)), 1000)
      fallback.intervalTickerFuncRef = intervalTickerFuncRef

      // Update Store
      Store.dispatch(set_clock({ active: true, currentItem: id, activeClockStartTime_millis: now, intervalTickerFuncRef }))

      // Update home state 
      setActiveClock(true)

      console.log('Sucessfully clocked in')

    } catch (e) {
      console.error('# Refused to start clock, reverting @ util/home - master_changeClockState - clock_In() - ')
      console.error(e)
      alert('Refused to start clock')
      console.log('State on fail: ', Store.getState())

      // Revert animations
      animations.ClockOut()

      // Clear interval ticker
      clearInterval(fallback.intervalTickerFuncRef)
      // FIXME
      return

      // Revert database changes made
      //  BUG if given nonexistent ID, database crashes
      // [ ] use master_deleteEntry()
      await database.delete_withId(fallback.id).catch(e => fallback.revertFailed = true)

      // Revert changes made to Store, set active back to false
      Store.dispatch(set_clock({ active: false, currentItem: -1, activeClockStartTime_millis: -1, intervalTickerFuncRef: -1 }))

      // Revert any changes made to home state
      setActiveClock(false)

      if (fallback.revertFailed) console.error('Revert failed !!! ')
      else console.warn('Revert Sucessful')
    }


  }

  const clock_Out = async () => {
    console.log('# Stopping clock ... ')

    // Store initial state for fallback
    const state_clock = { ...Store.getState().ui.clock }

    // settings tags active:false & activeClockStartTime_millis: -1 when deleting all data from database
    // used to include activeClock deletion
    const flag_deleteAllData = state_clock.activeClockStartTime_millis <= -1
    const fallback = {}
    const end = Date.now()
    const start = state_clock.activeClockStartTime_millis

    try {
      // Set fallback values
      fallback.lastValues = state_clock.lastValues

      // Set animations
      animations.ClockOut()

      // Update and close out active clock
      // [x] use master_editEntry()
      // const { id } = flag_deleteAllData ? -1 : await database.storeData_UpdateTimeItem({ id: state_clock.currentItem, keyValuePairs: [{ key: 'end', value: end }] })
      const id = flag_deleteAllData ? -1 : await master_editEntry({ startTime: start, endTime: end, pockets, setPockets, flag_clockOut: true })

      console.log('id from master ', id)
      // Make sure the right entry was closed out
      if (!flag_deleteAllData && Number(id) !== Number(state_clock.currentItem))
        throw 'Deleted & id do not match (' + Number(id) + ' !== ' + Number(state_clock.currentItem) + ')! Reverting ... '


      // Update Store
      Store.dispatch(set_clock({
        active: false, currentItem: -1, activeClockStartTime_millis: -1, intervalTickerFuncRef: -1, lastValues: {
          start, end
        }
      }))

      // Clear ticker after catch
      // Update ticker state after catch

      // Update home state
      setActiveClock(false)
      console.log('Sucessfully clocked out')


    } catch (e) {
      console.error('# Refused to stop clock @ util/home - master_changeClockState - clock_Out - ')
      console.error(e)
      alert('Failed to stop clock, reverting')
      console.log('State on fail: ', Store.getState())

      // Revert animations
      animations.ClockIn()

      // FIXME
      return
      // Restore active clock
      // [ ] use master_newEntry()
      if (!flag_deleteAllData)
        await database.storeData_NewTimeItem({ start: state_clock.activeClockStartTime_millis, end: -1 })
          .catch(e => fallback.revert_failed = true)

      // [ ] use master_editEntry()
      else await database
        .storeData_UpdateTimeItem({ id: state_clock.currentItem, keyValuePairs: [{ key: 'end', value: -1 }] })
        .catch(e => fallback.revert_failed = true)

      // Revert Store
      Store.dispatch(set_clock({
        active: true,
        currentItem: state_clock.currentItem,
        activeClockStartTime_millis: state_clock.activeClockStartTime_millis,
        intervalTickerFuncRef: state_clock.intervalTickerFuncRef,
        lastValues: fallback.lastValues
      }))

      setActiveClock(true)

      if (fallback.revert_failed) console.error('Revert Unsucessful!!!')
      else console.warn('Revert Sucessful')

      return
    }

    // Clear ticker
    clearInterval(state_clock.intervalTickerFuncRef)

    // Update ticker state
    setTicker({ hours: 0, minutes: 0, seconds: 0 })


  }

  flag_active
    ? await clock_In()
    : await clock_Out()

}
export const master_deleteEntry = async ({ index, item, setPockets }) => {
  // BUG deleted entries not being automatically reflected in data array
  console.log("Master, Deleting item: ", item);

  // Delete item from database
  await delete_withId(item.Id)

  // Delete item from store
  Store.dispatch(set_dataArray({ remove: true, id: item.Id }))

  // Update state
  setPockets((draft) => {
    draft.hours.selected =
      Store.getState().data.dataArray[draft.hours.selected] === undefined
        ? null
        : draft.hours.selected;
  });
}
export const master_addEntry = async ({ startTime, endTime = -1, pockets, setPockets }) => {
  console.log("Master, Adding new entry")
  const currentArray = Store.getState().data.dataArray

  // Add new entry into database
  const id = await database.storeData_NewTimeItem({
    start: startTime,
    end: endTime,
  });

  // Retrieve added item from database
  const newTimeEntry = await database.getData_WithId(id);

  // Calculate where to add it into local state array
  const index = whereToInsertIntoDbArr({
    dbArray: currentArray,
    number: startTime,
  });


  // Insert entry to Store 
  Store.dispatch(set_dataArray({ insert: true, index, data: newTimeEntry }))

  // Set local state array
  setPockets((draft) => {
    draft.hours.navigation = "edit";

    if (endTime >= 0) draft.hours.selected = index;
    else draft.hours.selected = null
  });

  return id
}
export const master_editEntry = async ({
  startTime,
  endTime,
  pockets,
  setPockets,
  flag_clockOut = false
}) => {
  // BUG after clock out, edit time to new date does not move it in array
  // BUG - it goes but after refresh , its at new time with same start & end time
  // BUG - if move different entry than one that just ended, same story only after refresh & time still in tact

  console.log("Master, Editing existing entry ...")

  const options = {
    edits: [],
  };

  const dataArray = Store.getState().data.dataArray

  // if (flag_clockOut) {
  //   console.log('finding start time ', startTime, ' in array ', dataArray)
  //   console.log('finding id: ', (dataArray.find(element => element.Start === startTime).Id))
  // } else {
  //   console.log('Getting id from pockets.hours.edit: ', pockets.hours.edit)
  // }

  // If clocking out, get Id
  const { Id } = flag_clockOut ? dataArray.find(element => element.Start === startTime) : { Id: pockets.hours.edit }
  if (Id === undefined) throw 'Could not find database entry with matching start time'

  console.log('editing item with id: ', Id)

  // Get original database entry
  const originalItem = await database.getData_WithId(Id);
  console.log('Original item before edit: ', originalItem)

  // Check which changes are made
  const newStartTime = originalItem.Start !== startTime;
  const newEndTime = originalItem.End !== endTime;



  // Exit early if no changes made
  if (!newStartTime && !newEndTime) return;

  // Push key-value pairs for database update function 
  // @ts-ignore
  if (newStartTime) options.edits.push({ key: "Start", value: startTime });
  // @ts-ignore
  if (newEndTime) options.edits.push({ key: "End", value: endTime });

  // Update entry in database
  const { updatedEntry } = await database.storeData_UpdateTimeItem({
    id: Id,
    keyValuePairs: options.edits,
  });
  // console.log('New item after edit: ', updatedEntry) /Users/patcannon/Documents/Projects/Timekeep_V2/node_modules/.bin/mocha


  const mutatedArray = [...dataArray]
  mutatedArray.splice(mutatedArray.findIndex(item => item.Id === updatedEntry.Id), 1)

  const index_moveTo = whereToInsertIntoDbArr({ dbArray: mutatedArray, number: updatedEntry.Start })

  mutatedArray.splice(index_moveTo, 0, updatedEntry)

  // console.log('index_moveTo: ', index_moveTo)

  // Replace & sort entry into Store
  Store.dispatch(set_dataArray({
    replaceAll: true,
    data: mutatedArray
  }))


  setPockets((draft) => {
    if (flag_clockOut) {
      draft.hours.navigation = 'view'
      draft.hours.selected = null
    }
    else {
      draft.hours.navigation = "edit";
      draft.hours.selected = index_moveTo
    }

    draft.hours.edit = -1;
  });

  return Id
}
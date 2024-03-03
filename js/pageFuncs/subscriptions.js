import { router } from "expo-router";
import Store from "../Store/store.js";
import { set_settings, set_dataArray } from '../Store/data.js'
import { set_clock } from '../Store/ui.js'
import { master_changeClockState } from "./home.js";
import { save_settings } from './global'

export let unsubscribe_home

export function handleSubscription_index(setSetup) {
  const state = Store.getState().setup;

  if (state.setup && !state.loading && state.hasUserData) {
    console.log("Store set. State should be accurate: ", Store.getState());
    router.replace("home");
  } else setSetup(state);
}

export function handleSubscription_home({ setActiveClock, setTicker, pockets, setPockets }) {
  unsubscribe_home = Store.subscribe(async () => {
    console.log('subscribing to home ... ')
    const newState = Store.getState()

    // Initiates master changeClockState func, Working off flag
    if (newState.ui.flag_setClockChanging) {
      Store.dispatch(set_clock({ flag_setClockChanging: false }))
      master_changeClockState({ flag_active: !newState.ui.clock.active, setActiveClock, setTicker, pockets, setPockets })
    }
    // Saves settings in AsyncStorage, Working off flag
    if (newState.data.settingsChanged) {
      save_settings(newState.data.settings).then(res => {
        Store.dispatch(set_settings({ reset_settingsChanged: true }))
      })
    }
  })
  return unsubscribe_home
}

export function handleSubscription_drawer({ setHoursArr }) {
  const newState = Store.getState()

  if (newState.data.dataChanged) {
    Store.dispatch(set_dataArray({ reset_dataChanged: true }))
    console.log('Updating array.')
    setHoursArr([...newState.data.dataArray])
  }
}

export function handleSubscription_settings({ privacyMode, setPrivacyMode }) {
  if (!Store.getState().setup.setup) {
    console.log("Cleanup home ... ");
    unsubscribe_home();
    router.replace("/");
  }

  else if (privacyMode !== Store.getState().data.settings.privacy) {
    setPrivacyMode(Store.getState().data.settings.privacy);
    unsubscribe_home()
    router.replace('/home')
  }

}
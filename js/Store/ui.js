import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  userData: {},
  clock: {
    currentItem: -1,
    activeClockStartTime_millis: -1,
    intervalTickerFuncRef: -1,
    lastValues: { start: -1, end: -1 },
    active: false
  },
  flag_setClockChanging: false
}

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    reset_ui: (state, action) => {
      state.userData = {}
      state.clock = {
        currentItem: -1,
        activeClockStartTime_millis: -1,
        intervalTickerFuncRef: -1,
        lastValues: { start: -1, end: -1 },
        active: false
      }
      state.flag_setClockChanging = false

    },
    set_user: (state, action) => {
      state.userData = {
        name: action.payload.name,
        salary: action.payload.salary
      }
    },
    set_clock: (state, action) => {
      if (action.payload.active !== undefined)
        state.clock.active = action.payload.active

      if (action.payload.currentItem !== undefined) {
        state.clock.currentItem = action.payload.currentItem
      }
      if (action.payload.activeClockStartTime_millis !== undefined)
        state.clock.activeClockStartTime_millis = action.payload.activeClockStartTime_millis

      if (action.payload.intervalTickerFuncRef !== undefined)
        state.clock.intervalTickerFuncRef = action.payload.intervalTickerFuncRef

      if (action.payload.lastValues !== undefined)
        state.clock.lastValues = action.payload.lastValues

      if (action.payload.flag_setClockChanging !== undefined)
        state.flag_setClockChanging = action.payload.flag_setClockChanging
    }
  }
})

export default slice.reducer
export const { set_user, set_clock, reset_ui } = slice.actions

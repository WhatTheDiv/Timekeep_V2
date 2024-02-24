import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  loading: false,
  setup: false,
  hasUserData: false,
  animations: false,
  database: false,
  clock: false,
  appName: 'Timekeep' // origin
}

const slice = createSlice({
  name: 'setup',
  initialState,
  reducers: {
    reset_setup: (state, action) => {
      state.setup = false
      state.loading = false
      state.hasUserData = false
      state.animations = false
      state.database = false
      state.clock = false
    },
    set_variablesConfigured: (state, action) => {
      if (action.payload.animationsConfigured !== undefined)
        state.animations = action.payload.animationsConfigured

      if (action.payload.clockConfigured !== undefined)
        state.clock = action.payload.clockConfigured

      if (action.payload.hasUserData !== undefined)
        state.hasUserData = action.payload.hasUserData

      if (action.payload.databaseConfigured !== undefined)
        state.database = action.payload.databaseConfigured
    },
    set_setup: (state, action) => {
      if (action.payload.complete)
        state.loading = false, state.setup = true
      else if (!action.payload.complete)
        state.loading = false, state.setup = false

    }
  }
})

export default slice.reducer
export const { set_variablesConfigured, set_setup, reset_setup } = slice.actions

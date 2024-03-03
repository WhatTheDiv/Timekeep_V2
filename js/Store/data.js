import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dataArray: [],
  settings: {
    averagesRangeStart: new Date(new Date().getFullYear(), 0, 1).getTime(),
    averagesRangeEnd: 'current',
    workWeekStart: 1,
    hoursTab_open: true,
    statsTab_open: true,
    privacy: false,
    dbIndex: 0
  },
  settingsChanged: false,
  dataChanged: false,
}

const slice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    set_dataArray: (state, action) => {
      const pl = action.payload
      // Replace all --- payload = { replaceAll: true, data: [...] }
      if (pl.replaceAll && pl.data)
        state.dataArray = pl.data

      // Replace One --- payload = { replace: true, data: {...} }
      else if (pl.replace && pl.data)
        // @ts-ignore
        state.dataArray.splice(state.dataArray.findIndex(item => item.Id === pl.data.id), 1, pl.data
        )

      // Insert One --- payload = { insert: true, index: number, data: {...} }
      else if (pl.insert && pl.index >= 0 && pl.data) {
        console.log('inserting at index: ', pl.index)
        // @ts-ignore
        state.dataArray.splice(pl.index, 0, pl.data)
      }
      // Remove One --- payload = { remove: true, id }
      else if (pl.remove && pl.id >= 0)
        state.dataArray.splice(
          // @ts-ignore
          state.dataArray.findIndex(item => item.Id === pl.id),
          1
        )
      // Move Element --- payload = { move:true, index_to: num, data: {...}
      else if (pl.move && pl.data && pl.index_to >= 0) {
        state.dataArray.splice(
          // @ts-ignore
          pl.index_to, 0, pl.data
        )
        state.dataArray.splice(
          state.dataArray.findIndex(item => {
            (
              // @ts-ignore
              item.Id === pl.data.Id
              // @ts-ignore
              && (item.Start !== pl.data.Start
                // @ts-ignore
                || item.End !== pl.data.End)
            )
          }), 1
        )
      }

      // Handle flag
      if (pl.reset_dataChanged) state.dataChanged = false
      else state.dataChanged = true
    },
    set_settings: (state, action) => {
      if (action.payload.averagesRangeStart !== undefined)
        state.settings.averagesRangeStart = action.payload.averagesRangeStart

      if (action.payload.averagesRangeEnd !== undefined)
        state.settings.averagesRangeEnd = action.payload.averagesRangeEnd

      if (action.payload.workWeekStart !== undefined)
        state.settings.workWeekStart = action.payload.workWeekStart

      if (action.payload.hoursTab_open !== undefined)
        state.settings.hoursTab_open = action.payload.hoursTab_open

      if (action.payload.statsTab_open !== undefined)
        state.settings.statsTab_open = action.payload.statsTab_open

      if (action.payload.privacy !== undefined)
        state.settings.privacy = action.payload.privacy

      if (action.payload.dbIndex !== undefined)
        state.settings.dbIndex = action.payload.dbIndex


      if (action.payload.reset_settingsChanged)
        state.settingsChanged = false
      else state.settingsChanged = true
    },
    reset_data: (state, action) => {
      state.dataArray = []
      state.settings = initialState.settings
    }
  },
})


export default slice.reducer
export const { set_dataArray, set_settings, reset_data } = slice.actions
import { combineReducers } from "redux";
import ui from "./ui.js"
import setup from './setup.js'
import data from './data.js'

// Combine all reducers here

export default combineReducers({ ui, setup, data })
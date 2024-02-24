import { combineReducers } from "redux";
import ui from "./ui"
import setup from './setup'
import data from './data'

// Combine all reducers here

export default combineReducers({ ui, setup, data })
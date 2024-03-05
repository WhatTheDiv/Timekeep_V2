import { StyleSheet, Platform } from 'react-native'

export default StyleSheet.create({
  StatusBar: {
    height: Platform.OS === 'android' ? 30 : 0,
  },
  text_xSmall: {
    fontSize: 12
  },
  text_small: {
    fontSize: 18
  },
  text_medium: {
    fontSize: 30
  },
  text_large: {
    fontSize: 45
  },
  button_Primary_container: {
    backgroundColor: 'orange'
  },
  text_orange: {
    color: 'orange'
  },
  text_chocolate: {
    color: 'chocolate'
  },
  text_gray: {
    color: 'gray'
  },
  text_white: {
    color: 'white'
  },
  text_red: {
    color: 'red',
  },
  text_green: {
    color: 'green'
  },
  text_bold: {
    fontWeight: 'bold',
  },
  border_orange: {
    borderWidth: 1,
    borderColor: 'orange',
  },
  border_chocolate: {
    borderWidth: 1,
    borderColor: 'chocolate',
  },
  background_red: {
    backgroundColor: 'red'
  },
  background_orange: {
    backgroundColor: 'orange',
  },

})
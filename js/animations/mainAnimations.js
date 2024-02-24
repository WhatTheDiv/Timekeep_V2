import { useRef } from "react";
import { Animated, Dimensions, Easing } from 'react-native'

let animation_Values = {}

export const initialize = (av) => {
  animation_Values = av
  title.animate_opacity = animation_Values.broadClockState
  title.animate_position = animation_Values.broadClockState.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15]
  })
  mainButton.animate_opacity = animation_Values.startup
  mainButton.animate_scale = animation_Values.mainButtonScale
  mainButton.animate_buttonLocation = animation_Values.buttonLocation.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.height / 2 - screen.width / 2, 0]
  })
  mainButton.animate_buttonLocationScaleHelper = animation_Values.buttonLocation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screen.width / -2 - screen.width * .2]
  })
  counter.animate_opacity = animation_Values.broadClockState
  counter.animate_tickerOpacity = animation_Values.counterTicker
  drawer.animate_position = animation_Values.drawer.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screen.height * -.75]
  })
  drawer.animate_opacity = animation_Values.drawerStartup

  return { success: true }
}

export const screen = {
  width: Dimensions.get("window").width,
  height: Dimensions.get("window").height,
};

export const title = {
  animate_opacity: animation_Values.broadClockState,
  animate_position: animation_Values.broadClockState && animation_Values.broadClockState.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15]
  }),
}

export const mainButton = {
  buttonLocationVariable_clockedIn: 0,//.2,
  buttonLocationVariable_clockedOut: .6, //.9,
  buttonScaleVariable: {
    clockedIn: .6,
    clockedOut: .4,
  },
  animate_opacity: animation_Values.startup,
  animate_scale: animation_Values.mainButtonScale,
  animate_buttonLocation: animation_Values.buttonLocation && animation_Values.buttonLocation.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.height / 2 - screen.width / 2, 0]
  }),
  animate_buttonLocationScaleHelper: animation_Values.buttonLocation && animation_Values.buttonLocation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screen.width / -2 - screen.width * .2]
  }),
  moveMainButton: ({ duration, delay, value }) => {
    Animated.timing(animation_Values.buttonLocation, {
      toValue: value,
      delay,
      duration,
      easing: Easing.ease,
      useNativeDriver: true
    }).start()
  },
  scaleMainButton: ({ value, duration, delay }) => {
    Animated.timing(animation_Values.mainButtonScale, {
      toValue: value,
      duration: duration,
      delay: delay,
      easing: Easing.ease,
      useNativeDriver: true
    }).start()
  },
}

export const counter = {
  animate_opacity: animation_Values.broadClockState,
  animate_tickerOpacity: animation_Values.counterTicker,
  animateTicker_toggle: (state = "stop") => {
    const startTicker = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation_Values.counterTicker, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.ease
          }),
          Animated.timing(animation_Values.counterTicker, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.ease
          }),
        ])
      ).start()
    }
    const stopTicker = () => {
      Animated.timing(animation_Values.counterTicker, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true
      })
      animation_Values.counterTicker.stopAnimation()
    }
    if (state === "start") startTicker()
    else if (state === "stop") stopTicker()
  },
  animateClockStateChange({ active, duration, delay }) {
    Animated.timing(animation_Values.broadClockState, {
      duration,
      toValue: active ? 1 : 0,
      delay,
      useNativeDriver: true
    }).start()
  }
}

export const drawer = {
  drawerMaxHeight: screen.height * .75,
  // animate_position: 0,
  animate_position: animation_Values.drawer && animation_Values.drawer.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screen.height * -.75]
  }),
  animate_opacity: animation_Values.drawerStartup,
  slideDrawer: ({ duration, active, delay }) => {
    Animated.timing(animation_Values.drawer, {
      toValue: active ? .3 : 1,
      duration,
      easing: Easing.ease,
      delay,
      useNativeDriver: true
    }).start()
  },
  drawerOpacity: ({ duration, delay }) => {
    Animated.timing(animation_Values.drawerStartup, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true
    }).start()
  },
  drawerInitialAnimation({ active = true, timing }) {
    // give opacity to drawer with delay
    drawer.drawerOpacity({
      duration: timing.drawerInitialAnimation.duration,
      delay: timing.drawerInitialAnimation.delay
    })

    // slide drawer to normal position
    drawer.slideDrawer({
      duration: timing.drawerInitialAnimation.duration,
      active,
      delay: timing.drawerInitialAnimation.delay
    })
  }
}

export const timing = {
  bigButtonFadeIn: { // big button fading in on load
    duration: 1000
  },
  drawerInitialAnimation: { // phase two
    duration: 500,
    delay: 600 // hardcode must match timing.startupDelay
  },
  changeClockState: {
    duration: 500, // duration to move big button from clock in to clock out & initial
    delay: 0
  },
  startupDelay: 600 // delay between big button fade in and moving to its initial position
}

export function Startup() {
  console.log(':::   Running startup animations ... :::')
  // give opacity to big logo
  Animated.timing(animation_Values.startup, {
    toValue: 1,
    duration: timing.bigButtonFadeIn.duration,
    useNativeDriver: true,
  }).start()
}

export function ClockIn(d = true, initial = false) {
  const duration = timing.changeClockState.duration
  const delay = initial ? timing.startupDelay : timing.changeClockState.delay
  // from clocked out 

  // - scale button
  mainButton.scaleMainButton({
    duration,
    delay,
    value: mainButton.buttonScaleVariable.clockedIn
  })
  // - move button
  mainButton.moveMainButton({
    duration,
    delay,
    value: mainButton.buttonLocationVariable_clockedIn,
  })
  // - give opacity to title
  counter.animateClockStateChange.bind(this)({
    duration,
    delay,
    active: true
  })

  // - begin counter ticking animation
  counter.animateTicker_toggle("start")

  // - slide drawer down
  if (d) drawer.slideDrawer({ duration, active: true, delay })
}

export function ClockOut(d = true, initial = false) {
  const duration = timing.changeClockState.duration
  const delay = initial ? timing.startupDelay : timing.changeClockState.delay
  // from clocked in
  // - scale button
  mainButton.scaleMainButton({
    duration,
    delay,
    value: mainButton.buttonScaleVariable.clockedOut
  })
  // - move button
  mainButton.moveMainButton({
    duration,
    delay,
    value: mainButton.buttonLocationVariable_clockedOut,
  })
  // - remove opacity from title 
  counter.animateClockStateChange.bind(this)({
    duration,
    delay,
    active: false
  })

  // - stop counter ticking animation
  counter.animateTicker_toggle("stop")

  // - slide drawer up
  if (d) drawer.slideDrawer({ duration, active: false, delay })

}



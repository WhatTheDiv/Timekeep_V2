import Store from '../Store/store'


export function dateObj_ToMillis({ year, month, day, hour, minute, ampm }) {
  const getHour = () => {
    if (hour === 12 && ampm === 'am') return 0
    else if (hour === 12 && ampm === 'pm') return 12
    else if (ampm === 'pm') return hour + 12
    else return hour
  }

  const millis = new Date(
    year,
    month,
    day,
    getHour(),
    minute
  ).getTime();
  // console.log('(hour is actually', getHour(), ')')

  return millis
}

export function millis_ToDateObj(millis) {
  const d = new Date(millis);
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDay(),
    date: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),
  };
}

export function millis_toMonthAndDayStrings(millis) {
  const d = new Date(millis);
  const month_ = timeArrays.months[d.getMonth()];
  const day_ = d.getDate();
  const dayName = timeArrays.days[d.getDay()];

  // date: January 15
  // day: Monday
  return { date: month_ + " " + day_, day: dayName };
}

export function millis_toSecondsMinutesHours(millis) {
  // ... pass difference of millis for result

  const millis_inHours = 1000 * 60 * 60
  const millis_inMinutes = 1000 * 60
  const millis_inSeconds = 1000

  const hoursRemainder = millis % millis_inHours
  const hours = (millis - hoursRemainder) / millis_inHours
  const minutesRemainder = hoursRemainder % millis_inMinutes
  const minutes = (hoursRemainder - minutesRemainder) / millis_inMinutes
  const secondsRemainder = minutesRemainder % millis_inSeconds
  const seconds = (minutesRemainder - secondsRemainder) / millis_inSeconds

  return { seconds, minutes, hours }
}

export function secondsMinutesHours_toString({ hours, minutes, seconds }) {
  const h = hours > 1 || hours === 0 ? " Hours " : " Hour ";
  const m = minutes > 1 || minutes === 0 ? " Minutes " : " Minute ";
  const s = seconds > 1 || seconds === 0 ? " Seconds " : " Second ";

  // Example string --- "8 Hours 32 Minutes"
  if (hours >= 1) return hours + h + " " + minutes + m;
  else if (minutes >= 1) return minutes + m + " " + seconds + s;
  else return seconds + s;
}

// TODO add trim option to cut '0 Minutes' from showing
export function millis_toSecondsMinutesHoursString(millis, { trim = false }) {
  return secondsMinutesHours_toString(
    millis_toSecondsMinutesHours(millis)
  )
}

export function hoursMilitary_ToStandardWithAmPm(militaryHour) {
  const time = {};
  if (militaryHour === 0) {
    time.hour = 12;
    time.ampm = "AM";
  } else if (militaryHour === 12) {
    time.hour = 12;
    time.ampm = "PM";
  } else if (militaryHour > 0 && militaryHour < 12) {
    time.hour = militaryHour;
    time.ampm = "AM";
  } else {
    time.hour = militaryHour - 12;
    time.ampm = "PM";
  }

  // { hour, ampm }
  return time;
}

export function ticker_addOneTick(prev) {
  const flag = { seconds: false, minutes: false }
  const { seconds, minutes, hours } = prev
  const newTime = {}

  if (seconds === 59) flag.seconds = true
  if (flag.seconds && minutes === 59) flag.minutes = true

  newTime.seconds = flag.seconds ? 0 : seconds + 1
  newTime.minutes = flag.minutes ? 0 : flag.seconds && !flag.minutes ? minutes + 1 : minutes
  newTime.hours = flag.minutes ? hours + 1 : hours

  return { ...prev, ...newTime }
}

export function ticker_getTicks(millis) {
  // TODO
  const { hours, minutes, seconds } = millis_toSecondsMinutesHours(millis)
  return { hours, minutes, seconds }
}

export const timeArrays = {
  days: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  months: [
    "January",
    "Febuary",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  daysInMonths: [
    31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
  ]
}

export const dollarsPerPeriod = (period) => {
  const salary = Store.getState().ui.userData.salary
  if (period === 'yearly')
    return salary
  else if (period === 'weekly')
    return salary / 52
  else if (period === 'daily')
    return salary / 52 / 5
  else if (period === 'hourly')
    return salary / 52 / 40
  else return salary
}

export const numberMaxPrecision = (num, precision) => {
  // 41.0 = 41
  // 41.19939 = 41.1

  // Exit early if num is NaN
  if (isNaN(num))
    return num

  const numberString = num.toString()
  const safeNumber = numberString.concat(Array(precision).fill(0).join(''))

  // Get index of decimal
  const index = numberString.indexOf('.')

  // If no decimal return whole number string
  if (index === -1)
    return numberString

  // If (precision) = 0, return whole number string
  // If (precision) = (number) && all characters are 0's
  else if (precision <= 0 || Number(numberString.slice(index + 1, index + 1 + precision)) <= 0)
    return numberString.slice(0, index)

  const decimalNumber = safeNumber.slice(index + 1, index + 1 + precision)
  const arr = decimalNumber.split('')
  arr.reverse()
  const significantDigitIndex_reversed = arr.find(n => n > 0)

  // Exit early if it is safe to truncate
  if (significantDigitIndex_reversed === undefined)
    return safeNumber.slice(0, index + 1 + precision)

  arr.reverse()
  const i = arr.findLastIndex(n => n === significantDigitIndex_reversed)
  const newNumberWithPrecisionTruncated = safeNumber.slice(0, index + 1 + i + 1)


  return newNumberWithPrecisionTruncated







}
import * as SQLite from 'expo-sqlite';
import Store from '../Store/store'

export let database = {}

// Initialize database
export function init_database({ dbIndex }) {
  try {
    database = SQLite.openDatabase('db' + dbIndex + '.db')
    database.transaction(tx => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS Times (Id INTEGER PRIMARY KEY AUTOINCREMENT not null, Start INTEGER, End INTEGER);"
      )
    })

    return { success: true }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

// Get Data
export async function getData_all() {
  return new Promise((resolve, reject) => {
    try {
      database.transaction(tx => {

        tx.executeSql("SELECT * FROM Times",
          [],
          (_, res) => {
            resolve(res.rows._array)
          },
          (_, e) => { throw new Error('Failed to get everything from db - ' + e.message) }
        )
      })
    } catch (e) {
      console.error('* Error at getData_all: ', e.message)
      console.warn(e)
      reject(e)
    }
  })
}

export async function getData_WithId(id) {
  return new Promise((resolve, reject) => {
    try {
      database.transaction(tx => {
        tx.executeSql(
          "SELECT * FROM Times Where ID = ?",
          [id],
          (_, res) => { resolve(res.rows._array[0]) },
          (_, e) => { reject(e) }
        )
      })
    } catch (e) {
      console.error('* Error at getDataWithId')
      reject(e)
    }
  })
}

export async function getData_AllBetweenTwoTimes({ start, end }) {
  return new Promise((resolve, reject) => {
    try {

      database.readTransaction(tx => {
        tx.executeSql(
          "SELECT * FROM Times WHERE Start BETWEEN ? AND ?",
          [start, end],
          (_, res) => resolve(res.rows._array),
          (_, e) => { reject(e) }
        )
      })
    } catch (e) {
      reject(e)
    }
  })
}

export async function getData_LastEntryWithoutEndTime() {
  return new Promise(async (resolve, reject) => {
    try {

      database.transaction(tx => {
        tx.executeSql(
          "SELECT End, Start, Id FROM Times Where End=-1",
          [],
          (_, res) => {
            const rows = res.rows._array
            let conflictArr = []

            if (rows.length < 1) {
              console.log(":::   No active clock found.         :::")
              resolve({
                start: -1,
                id: -1,
                conflictArr
              })
            }

            if (rows.length >= 1) {
              console.log(":::   Active clock found.            :::")

              if (rows.length > 1) {
                console.error('!!!   More than 1 active time          !!!')
                conflictArr = rows
              }

              resolve({
                start: rows[0].Start,
                id: rows[0].Id,
                conflictArr
              })
            }
          },
          (_, e) => {
            console.log(e)
            throw new Error('* Failed to get last entry without end time')
          })
      })

    } catch (e) {
      console.error('Error @ getLastEntryWithoutEndTime')
      reject(e)
    }
  })
}
export async function getData_totalLengthOfDatabase() {
  return new Promise((resolve, reject) => {
    try {
      database.transaction(tx => {

        tx.executeSql("SELECT COUNT(*) FROM Times",
          [],
          (_, res) => {
            resolve(res.rows._array[0]["COUNT(*)"])
          },
          (_, e) => {
            console.error('* Error in transaction at getData_totalLengthOfDatabase')
            reject(e)
          }
        )
      })
    } catch (e) {
      console.error('* Error at getData_totalLengthOfDatabase')
      reject(e)
    }
  })
}

// Store Data
export async function storeData_NewTimeItem({ start, end }) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('sending transactions', { start, end })
      console.log('database: ', database)

      database.transaction(tx => {
        tx.executeSql(
          "INSERT INTO Times (Start, End) VALUES (?,?) RETURNING Id",
          [start, end],
          (_, result) => {
            console.log('success')
            resolve(result.insertId)
          },
          (_, e) => {
            console.error('* Transaction error message')
            reject(e)
          }
        )
      })

    } catch (e) {
      console.error('* Error at storeNewTimeItem()')
      reject(e)
    }
  })
}

export async function storeData_UpdateTimeItem({ id, keyValuePairs }) {
  return new Promise((resolve, reject) => {
    try {
      // TODO add a check here for valid id
      const strings = []

      for (let i = 0; i < keyValuePairs.length; i++) {
        if (!keyValuePairs[i].key || !keyValuePairs[i].value) throw new Error('Bad key value pair: ' + keyValuePairs[i])

        strings.push(keyValuePairs[i].key + ' = ' + keyValuePairs[i].value)
        if (i < keyValuePairs.length - 1) strings.push(', ')
      }

      const finalStatement = "UPDATE Times SET " + strings.join("") + ' WHERE Id = ' + id + ' RETURNING *'
      database.transaction(tx => {
        tx.executeSql(
          finalStatement,
          [],
          (_, result) => {
            // TODO change id in resolve to original id
            resolve({ sucess: true, id: result.rows._array[0].Id, updatedEntry: result.rows._array[0] })
          },
          (_, e) => {
            console.log('* Transaction error message: ', e)
            throw new Error('* Failed to update using keyValuePairs:' + JSON.stringify(keyValuePairs))
          }
        )
      })

    } catch (e) {
      console.error('* Error at updateTimeItem: ', e.message)
      console.log(e)
      reject({ id, message: e.message })
    }
  })
}

// Delete Data
export async function delete_withId(id) {
  return new Promise((resolve, reject) => {
    try {
      database.transaction(tx => {
        tx.executeSql(
          "DELETE FROM Times WHERE ID=? RETURNING Id",
          [id],
          (tx, res) => {
            if (res.rows._array.length <= 0 || Number(res.rows._array[0].Id) !== Number(id)) {
              console.error('No item deleted or Item deleted does not match ID given', res)
              reject({ success: false })
            }
            resolve({ success: true, id: res.rows._array[0].Id })
          },
          (_, e) => {
            console.log('* Transaction error message: ', e)
            throw new Error('* Failed to delete data with Id ' + id)
          }
        )
      })
    } catch (e) {
      console.error('Error at delete_withId: ', e.message)
      console.log(e)
      reject({ success: false })
    }
  })
}

export async function delete_everythingFromDatabase() {
  return new Promise((resolve, reject) => {
    try {
      database.transaction(tx => {
        tx.executeSql(
          "DELETE FROM Times",
          [],
          (_, res) => { resolve(true) },
          (_, e) => {
            console.error(e)
            console.error('* Transaction error @ delete_everythingFromDatabase()')
            reject()
          }
        )
      })

    } catch (e) {
      console.error(e)
      console.error('Error caught @ delete_everythingFromDatabase()')
      reject()
    }
  })
}





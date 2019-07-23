'use strict'


if (!window.storage) {
  const cash = new Map()

  function cashLoad(name, data) {
    const saveDatas = localStorage.getItem(name) || '{}'
    const saveJson = JSON.parse(saveDatas)

    const saveCash = cash.get(name) || new Map()
    for (const key in saveJson) {
      data[key] = saveJson[key]
      saveCash.set(key, saveJson[key])
    }
    cash.set(name, saveCash)
  }

  function handler(name) {
    return {
      get(target, prop) {
        return cash.get(name).get(prop)
      },

      set(target, prop, value) {
        const saveData = JSON.parse(localStorage.getItem(name) || '{}')
        saveData[prop] = value
        target[prop] = value
        cash.get(name).set(prop, value)
        localStorage.setItem(name, JSON.stringify(saveData))
        return true
      },

      deleteProperty(target, prop) {
        const saveData = JSON.parse(localStorage.getItem(name) || '{}')
        delete saveData[prop]
        delete target[prop]
        cash.get(name).delete(prop)
        localStorage.setItem(name, JSON.stringify(saveData))
        return true
      }
    }
  }


  window.storage = (name) => {
    const result = new Proxy({}, handler(name))

    const saveDatas = localStorage.getItem(name) || '{}'
    const saveJson = JSON.parse(saveDatas)
    !cash.get(name) && cash.set(name, new Map())
    for (const key in saveJson) {
      result[key] = saveJson[key]
    }

    return result
  }
}
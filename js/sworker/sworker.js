'use strict'


if (!window.sworker) {

  function isObj(obj) {
    return obj !== null && typeof obj === 'object'
  }

  window.sworker = new class StaticWorker {
    run(message, code, option) {
      return new Promise((resolve, reject) => {
        let createFrag = false
        if (typeof code === 'function') {
          code = this.create(code)
          createFrag = true
        }

        const worker = new Worker(code, option)

        worker.addEventListener('message', (e) => {
          createFrag && URL.revokeObjectURL(code)
          resolve(e.data)
        })

        worker.addEventListener('error', (err) => {
          createFrag && URL.revokeObjectURL(code)
          reject(err)
        })

        if (isObj(message) && typeof message.buffer !== 'undefined') {
          worker.postMessage(message, [message.buffer])
        }

        worker.postMessage(message)
      })
    }

    create(func) {
      const code = `'use strict';onmessage=${func.toString()}`
      return URL.createObjectURL(new Blob([code], { type: 'application/javascript' }))
    }
  }
}
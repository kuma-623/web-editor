'use strict'

if (storage) {
  const saveFiles = storage('files')

  // エディター
  const editor = new class Editor {
    constructor() {
      const save = storage('editor')
      const editor = this._editor = ace.edit('ace')

      editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true
      })
      editor.setFontSize(16)
      editor.setShowPrintMargin(false)
      editor.session.setTabSize(2)
      editor.session.setUseSoftTabs(true)
      editor.session.setMode('ace/mode/javascript')
      editor.$blockScrolling = Infinity

      editor.focus()

      editor.addEventListener('change', this._saveEvent(editor, save), false)


      editor.commands.addCommand({
        name: 'myCommand',
        bindKey: { win: 'Alt-N', mac: 'Option-N' },
        exec: () => {
          const newFile = document.getElementById('new-file')
          newFile && newFile.click()
        }
      })

      editor.commands.addCommand({
        name: 'myCommand',
        bindKey: { win: 'F5', mac: 'F5' },
        exec: () => {
          const newFile = document.getElementById('run')
          newFile && newFile.click()
        }
      })

      editor.commands.addCommand({
        name: 'myCommand',
        bindKey: { win: 'Ctrl-Shift-S', mac: 'Ctrl-Shift-S' },
        exec: () => {
          const newFile = document.getElementById('build')
          newFile && newFile.click()
        }
      })

      editor.commands.addCommand({
        name: 'myCommand',
        bindKey: { win: 'Ctrl-S', mac: 'Ctrl-S' },
        exec: () => {
          console.log('')
        }
      })


      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const target = mutation.target
          const textColor = window.getComputedStyle(target, null).getPropertyValue('color')
          const backColor = window.getComputedStyle(target, null).getPropertyValue('background-color')

          const app = document.getElementById('app')
          app.style.color = textColor
          app.style.backgroundColor = backColor
          return
        }
      })

      observer.observe(editor.container, { attributes: true, attributeFilter: ['class'] })


      const autocompleatCheck = document.getElementById('autocompleat')
      if (save.autocompleat === undefined) save.autocompleat = true
      autocompleatCheck.checked = save.autocompleat
      autocompleatCheck.addEventListener('change', (e) => {
        const value = e.currentTarget.checked
        save.autocompleat = value
        editor.setOptions({ enableLiveAutocompletion: value })
      })


      const syntaxes = [
        'ambiance',
        'chaos',
        'chrome',
        'clouds',
        'clouds_midnight',
        'cobalt',
        'crimson_editor',
        'dawn',
        'dracula',
        'dreamweaver',
        'eclipse',
        'github',
        'gob',
        'gruvbox',
        'idle_fingers',
        'iplastic',
        'katzenmilch',
        'kr_theme',
        'kuroir',
        'merbivore',
        'merbivore_soft',
        'monokai',
        'mono_industrial',
        'pastel_on_dark',
        'solarized_dark',
        'solarized_light',
        'sqlserver',
        'terminal',
        'textmate',
        'tomorrow',
        'tomorrow_night',
        'tomorrow_night_blue',
        'tomorrow_night_bright',
        'tomorrow_night_eighties',
        'twilight',
        'vibrant_ink',
        'xcode',
      ]

      const selector = document.getElementById('syntax')

      function styleChangeEvent(editor, syntaxes) {
        return (e) => {
          let type
          const target = e.currentTarget
          const tagName = target.tagName.toLowerCase()
          if (tagName === 'select') {
            const value = target.selectedIndex
            type = syntaxes[value]
          } else if (tagName === 'option') {
            type = target.textContent
          }

          save.syntax = type
          editor.setTheme(`ace/theme/${type}`)
        }
      }

      selector.addEventListener('change', styleChangeEvent(editor, syntaxes))


      syntaxes.forEach((syntax, i) => {
        const option = document.createElement('option')
        option.textContent = syntax
        selector.appendChild(option)
        if (syntax === (save.syntax || 'monokai')) {
          selector.selectedIndex = i
          selector.dispatchEvent(new Event('change'))
        }
      })
    }

    _saveEvent(editor, save) {
      let saveFrag = false
      let timer
      const saveEvent = () => {
        saveFrag = true
        if (timer) return

        const activeTab = document.querySelector('.tab-active')
        if (!activeTab) return

        const fileName = activeTab.dataset.name
        saveFiles[fileName] = editor.getValue()

        timer = setTimeout(() => {
          timer = undefined
          if (saveFrag) {
            saveFrag = false
            saveEvent()
          }
        }, 500)
      }

      return saveEvent
    }

    get value() { return this._editor.getValue() }
    set value(v) { this._editor.setValue(v, 1) }

    get el() { return this._editor.container }

    set mode(v) {
      if (v === 'js') v = 'javascript'
      this._editor.session.setMode(`ace/mode/${v}`)
    }
  }


  // index
  const tabData = storage('tab')

  if (typeof saveFiles['index.html'] === 'undefined') saveFiles['index.html'] = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title></title>
</head>
<body>

</body>
</html>`

  if (!tabData.focus) { tabData.focus = 'index.html' }


  const tabEvent = (() => {
    const img = document.createElement('img')
    img.classList.add('img')
    return (e) => {
      const target = e.currentTarget

      const activeTab = document.querySelector('.tab-active')
      activeTab && activeTab.classList.remove('tab-active')
      target.classList.add('tab-active')

      const fileName = target.dataset.name
      const ext = fileName.split('.').pop().toLowerCase()
      editor.value = saveFiles[fileName] || ''

      if (/^(?:jpeg|jpg|png|gif)$/.test(ext)) {
        img.src = saveFiles[fileName]
        editor.el.style.visibility = 'hidden'
        document.getElementById('main').appendChild(img)
      } else {
        img.remove()
        editor.el.style.visibility = ''
      }

      switch (ext) {
        case 'html':
        case 'js':
        case 'css':
        case 'json':
          editor.mode = ext
          break
        default:
          editor.mode = 'text'
      }

    }
  })(saveFiles, editor)


  function addTab(name) {
    const tabContainer = document.getElementById('tab-container')
    const tab = document.createElement('button')
    tab.classList.add('tab')
    const fileName = document.createElement('input')
    fileName.classList.add('tab-name')
    fileName.spellcheck = false
    fileName.value = tab.dataset.name = name

    const close = document.createElement('button')
    tab.classList.add('tab-close')
    const icon = document.createElement('i')
    icon.classList.add('material-icons')
    icon.textContent = 'clear'

    tab.appendChild(fileName)
    tab.appendChild(close)
    close.appendChild(icon)
    tabContainer.appendChild(tab)
    fileName.focus()

    tab.addEventListener('click', tabEvent)

    fileName.addEventListener('change', nameChangeEvent(tab, fileName.value))

    close.addEventListener('click', (e) => {
      e.stopPropagation()
      tab.remove()
      delete saveFiles[name]
      const ext = name.split('.').pop().toLowerCase()
      if (ext === 'css') {
        const reg = new RegExp(`( |\t)*<link rel=stylesheet href='${name}>\n`)
        saveFiles['index.html'] = saveFiles['index.html'].replace(reg, '')
      } else if (ext === 'js') {
        const reg = new RegExp(`( |\t)*<script src='${name}'><\/script>\n`)
        saveFiles['index.html'] = saveFiles['index.html'].replace(reg, '')
      }

      const activeTab = document.querySelector('.tab-active')
      if (activeTab) {
        activeTab.click()
      } else {
        const tab = document.querySelector('.tab')
        tab && tab.click()
      }
    })

    return tab
  }


  function nameChangeEvent(tab, beforeName) {
    return (e) => {
      const target = e.currentTarget
      const value = target.value
      tab.dataset.name = value

      if (value in saveFiles) {
        alert('その名前は既に存在しています')
        target.value = beforeName
        return
      }

      if (/[`'"\/\\\[\]:;|=,]/.test(value)) {
        alert('その名前は使用出来ません')
        target.value = beforeName
        return
      }

      delete saveFiles[beforeName]
      saveFiles[value] = editor.value


      const ext = beforeName.split('.').pop().toLowerCase()
      if (ext === 'css') {
        const exp = new RegExp(`( |\t)*<link rel="stylesheet" href="${beforeName}">\n`)
        console.log(exp)
        saveFiles['index.html'] = saveFiles['index.html'].replace(exp, '')
      } else if (ext === 'js') {
        const exp = new RegExp(`( |\t)*<script src="${beforeName}"><\/script>\n`)
        saveFiles['index.html'] = saveFiles['index.html'].replace(exp, '')
      }
      insertTag(value)

      beforeName = value
    }
  }


  function insertTag(name) {
    const ext = name.split('.').pop().toLowerCase()
    if (ext === 'css') {
      saveFiles['index.html'] = saveFiles['index.html'].replace(/( |\t)*<\/head>/, `$1 <link rel="stylesheet" href="${name}">\n$1</head>`)
    } else if (ext === 'js') {
      saveFiles['index.html'] = saveFiles['index.html'].replace(/( |\t)*<\/body>/, `$1 <script src="${name}"></script>\n$1</body>`)
    }

    const activeTab = document.querySelector('.tab-active')
    activeTab.click()
  }


  let fileList = []
  for (const fileName in saveFiles) {
    if (fileName !== 'index.html')
      fileList.push(fileName)
  }
  fileList = fileList.sort()
  for (const fileName of fileList) {
    addTab(fileName)
  }


  const tabs = document.getElementsByClassName('tab')
  for (const tab of tabs) {
    if (tab) {
      tab.addEventListener('click', tabEvent)
      if (tab.dataset.name === tabData.focus) {
        tab.click()
      }
    }
  }


  document.getElementById('add-tab').addEventListener('click', () => {
    let fileCount = 0
    let fileName = `script_${fileCount}.js`

    while (typeof saveFiles[fileName] !== 'undefined') {
      fileCount++
      fileName = `script_${fileCount}.js`
    }

    saveFiles[fileName] = ''
    const tab = addTab(fileName)
    insertTag(fileName)

    tab.click()
  })


  function readWorker(e) {
    const data = e.data
    const ext = data.name.split('.').pop().toLowerCase()

    const reader = new FileReader()
    reader.onload = (e) => {
      const res = e.target.result
      postMessage(res)
    }

    switch (ext) {
      case 'jpeg':
      case 'jpg':
      case 'png':
      case 'gif':
        reader.readAsDataURL(data)
        break
      default:
        reader.readAsText(data)
        break
    }
  }


  function readSjisWorker(e) {
    const data = e.data

    const reader = new FileReader()
    reader.onload = (e) => {
      const res = e.target.result
      postMessage(res)
    }

    reader.readAsText(data, 'sjis')
  }



  const uploader = document.getElementById('upload')
  uploader.addEventListener('change', (e) => {
    const files = e.target.files
    if (files.length <= 0) return

    for (const file of files) {
      sworker.run(file, readWorker).then(async (res) => {
        if (/ã|ä|ã|å|ç|æ|è|§|£|º|ª|«|¶|¹|¤|¾|½/.test(res)) {
          const res = await sworker.run(file, readSjisWorker)
          saveFiles[file.name] = res
        } else {
          saveFiles[file.name] = res
        }

        addTab(file.name)
        insertTag(fileName)
      })
    }
  })



  const addModuleEvent = (module) => {
    const { src } = module
    return () => {
      insertTag(src)
    }
  }


  // モジュール
  const modules = [
    { name: 'pixi.js', note: 'webGLを使用する2d描画ライブラリ。RPGツクール等の描画エンジンとして使われている', src: 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.1.0/pixi.min.js' },
    { name: 'tree.js', note: 'webGLを使用する3d描画ライブラリ。拡張してMMDのミクさんとか表示できる', src: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/106/three.min.js' },
    { name: 'vue.js(test)', note: '双方向データバインディングが得意ななフレームワークのテスト版', src: 'https://cdn.jsdelivr.net/npm/vue/dist/vue.js' },
    { name: 'mui.css', note: 'マテリアルデザイン用のcssフレームワーク。軽量で便利', src: 'https://cdn.muicss.com/mui-0.9.42/css/mui.min.css' },
    { name: 'mui.js', note: 'マテリアルデザイン用のjsフレームワーク。動的にdom操作する時などに一緒に読み込む', src: 'https://cdn.muicss.com/mui-0.9.42/js/mui.min.js' },
  ]
  const list = document.getElementById('module-list')
  const fragment = document.createDocumentFragment()
  for (const module of modules) {
    const li = document.createElement('li')
    const button = document.createElement('button')
    const span = document.createElement('span')
    span.textContent = module.name
    button.appendChild(span)
    li.appendChild(button)
    fragment.appendChild(li)

    if (module.note && module.note !== '') {
      const note = document.createElement('div')
      note.classList.add('module-note')
      note.textContent = module.note
      li.appendChild(note)
    }

    button.addEventListener('click', addModuleEvent(module))
  }
  list.appendChild(fragment)

  const module = document.getElementById('modules')
  module.addEventListener('click', () => {
    list.classList.toggle('module-list-hide')
  })

  // 入力関数


  // 切り替え関数

  // ビルド
  const build = () => {
    const index = saveFiles['index.html']

    let res = ''
    const nodes = index.split(/(<[^>]*>)/g).map(i => { return i.replace(/^[\r\n ]*$/, ' ') })
    let type = ''
    for (const node of nodes) {
      let replace = node
      if (type === 'comment') {
        type = ''
        continue
      }

      if (/-->/.test(node)) type = ''

      if (node.charAt(0) === '<') {
        if (/^<!--/.test(node)) {
          type = 'comment'
          continue
        } else if (/^<link/i.test(node) && /rel[\r\n\t ]*=[\r\n\t ]*["']?stylesheet["']?/i.test(node)) {
          const hrefHead = node.match(/href[\r\n\t ]*=[\r\n\t ]*["']?/)
          if (hrefHead) {
            let href = node.match(/[^`'"\/\\\[\]:;|=,]*\.css/)
            alert(node, href)
            if (href) {
              href = href[0]
            }
            if (!/(?:https?:)?\/\//.test(href)) {
              replace = `<style>${saveFiles[href]}</style>`
            }
          }
        } else if (/^<script/i.test(node) && (/type[\r\n\t ]*=[\r\n\t ]*["']?javascript["']?/i.test(node) || !/type[\r\n\t ]*=/i.test(node))) {
          const srcHead = node.match(/src[\r\n\t ]*=[\r\n\t ]*["']?/)
          if (srcHead) {
            let src = node.match(/[^`'"\/\\\[\]:;|=,]*\.js/)
            if (src) {
              src = src[0]
            }
            if (!/(?:https?:)?\/\//.test(src)) {
              replace = `<script>${saveFiles[src]}</script>`
            }
          }
        }
      }

      for (const file in saveFiles) {
        if (/(jpeg|jpg|png|gif)$/i.test(file)) {
          if (replace.charAt(0) === '<') {
            const fileReg = new RegExp(file, 'g')
            replace = replace.replace(fileReg, saveFiles[file])
          } else {
            const fileReg = new RegExp(`["'\`]${file}["'\`]`, 'g')
            replace = replace.replace(fileReg, saveFiles[file])
          }
        }
      }

      res += replace
    }
    return res
  }

  // 実行
  const run = document.getElementById('run')
  run.addEventListener('click', () => {
    const res = build()
    const url = URL.createObjectURL(new Blob([res], { type: 'text/html' }))
    location.href = url
  })

  // パス変換ツール


  // テンプレート作成ツール

  // 出力
  const buildButton = document.getElementById('build')
  buildButton.addEventListener('click', () => {
    const res = build()
    const url = URL.createObjectURL(new Blob([res], { type: 'text/html' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'index.html'
    a.click()
    a.remove()
  })
}
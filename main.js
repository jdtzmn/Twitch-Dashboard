const { app, BrowserWindow, ipcMain, dialog, Notification, globalShortcut } = require('electron')
const path = require('path')
const url = require('url')

// Start the application menubar
const win = require('./src/window')
const menubar = require('./src/menu')

app.on('ready', () => {
  menubar.init()
  win.createWindow()
  globalShortcut.register('CommandOrControl+Alt+P', () => {
    win.getWindow().webContents.send('activate-preview-window')
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    win.createWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// ---------------------------------------
// ---------- AUTHENTICATION -------------
// ---------------------------------------

ipcMain.on('twitch-login', (event, authURL) => {
  let authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    title: 'Twitch',
    parent: win.getWindow(),
    modal: process.platform !== 'win32'
  })
  authWindow.loadURL(authURL)

  const handleRedirect = (url) => {
    // get code from url
    let codeRegex = /#access_token=([\d\w]*)/
    let code = codeRegex.exec(url) ? codeRegex.exec(url)[1] : null

    // get scopes from url
    let scopeRegex = /&scope=(.*)/
    let scopeString = scopeRegex.exec(url) ? scopeRegex.exec(url)[1] : null
    let scopes = scopeString ? scopeString.split('+') : null

    // get error from url
    let errorRegex = /\?error=/
    let error = errorRegex.exec(url)

    if (code || error) authWindow.destroy()

    if (code) {
      let authObj = {
        token: code,
        scope: scopes,
        state: null,
        error: null,
        errorDescription: null
      }
      event.sender.send('twitch-auth', JSON.stringify(authObj))
    } else if (error) {
      dialog.showMessageBox({
        type: 'error',
        title: 'Authentication Unsuccessful',
        message: 'Authentication Unsuccessful',
        detail: 'Please try again later'
      })
    } else {
      authWindow.show()
    }
  }

  authWindow.webContents.on('will-navigate', (event, url) => handleRedirect(url))
  authWindow.webContents.on('did-get-redirect-request', (event, oldURL, newURL) => handleRedirect(newURL))

  authWindow.on('close', () => { authWindow = null })
})

// ---------------------------------------
// ------------ NOTIFICATIONS ------------
// ---------------------------------------

ipcMain.on('chat-receive', (event, options) => {
  const n = new Notification({
    title: options.title,
    body: options.body,
    icon: options.icon,
    hasReply: true,
    replyPlaceholder: '@' + options.title
  })

  n.on('reply', (e, reply) => event.sender.send('chat-reply', {
    to: options.title,
    reply
  }))

  n.show()
})

// ---------------------------------------
// ----------- PREVIEW WINDOW ------------
// ---------------------------------------

let preview = null

ipcMain.on('toggle-preview-window', (event, videoURL) => {
  if (preview) {
    preview.destroy()
    preview = null
  } else {
    preview = new BrowserWindow({
      alwaysOnTop: true,
      width: 515,
      height: 322,
      x: 0,
      y: 0,
      backgroundColor: '#000000',
      titleBarStyle: 'none',
      frame: !(process.platform === 'darwin')
    })

    preview.loadURL(url.format({
      pathname: path.join(__dirname, './lib/preview.html'),
      search: '?' + videoURL,
      protocol: 'file:',
      slashes: true
    }))

    // hide the menubar on windows and linux
    preview.setMenuBarVisibility(false)

    // ---------------------------------------
    // ----------- LOCKING RESIZES -----------
    // ---------------------------------------

      let timeout, resized

      preview.on('resize', () => {
        if (!resized) {
          clearTimeout(timeout)
          timeout = setTimeout(() => {
            resized = true
            let width = preview.getContentSize()[0]
            preview.setContentSize(width, Math.round(width * 0.621))
          }, 100)
        } else {
          resized = false
        }
      })
    if (!(process.platform === 'darwin')) {
      // ---------------------------------------
      // --- Windows PULL TO NEAREST CORNER ----
      // ---------------------------------------

      let timeout

      preview.on('move', () => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          preview.webContents.send('preview-window-mouseup')
        }, 100)
      })
    }

    preview.on('close', () => {
      preview = null
    })
  }
})

// ---------------------------------------
// ----- MacOS PULL TO NEAREST CORNER ----
// ---------------------------------------

ipcMain.on('preview-window-mouseup', (event, dimensions) => moveWindowToCorner(dimensions))

// ---------------------------------------
// -------------- MOVE WINDOW ------------
// ---------------------------------------

const moveWindowToCorner = (dimensions) => {
  let interval = setInterval(() => {
    let windowSize = preview.getSize()
    let position = preview.getPosition()
    position[0] += windowSize[0] / 2
    position[1] += windowSize[1] / 2
    let transition = process.platform === 'darwin'
    if (position[0] < dimensions[0] / 2) {
      if (position[1] < dimensions[1] / 2) {
        preview.setPosition(0, 0, transition)
      } else {
        preview.setPosition(0, dimensions[1] - windowSize[1], transition)
      }
    } else {
      if (position[1] < dimensions[1] / 2) {
        preview.setPosition(dimensions[0] - windowSize[0], 0, transition)
      } else {
        preview.setPosition(dimensions[0] - windowSize[0], dimensions[1] - windowSize[1], transition)
      }
    }
  }, 50)

  setTimeout(() => {
    clearInterval(interval)
  }, 150)
}

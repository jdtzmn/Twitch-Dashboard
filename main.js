const { app, BrowserWindow, ipcMain, dialog } = require('electron')

// Start the application menubar
const win = require('./src/window')
const menubar = require('./src/menu')

app.on('ready', () => {
  menubar.init()
  win.createWindow()
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
    modal: true
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

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url')

let win

function createWindow () {
  win = new BrowserWindow({
    width: 1150,
    height: 760,
    minWidth: 1150,
    minHeight: 760,
    icon: './icons/icon@2x.png',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#8642f4'
  })

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

ipcMain.on('twitch-login', (event, authURL) => {
  let authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    title: 'Twitch',
    parent: win,
    modal: true
  })
  authWindow.loadURL(authURL)

  const handleRedirect = (url) => {
    let codeRegex = /#access_token=([\d\w]*)/
    let scopeRegex = /&scope=(.*)/
    let code = codeRegex.exec(url) ? codeRegex.exec(url)[1] : null
    let scopeString = scopeRegex.exec(url) ? scopeRegex.exec(url)[1] : null
    let scopes = scopeString ? scopeString.split('+') : null

    if (code) {
      authWindow.destroy()

      let authObj = {
        token: code,
        scope: scopes,
        state: null,
        error: null,
        errorDescription: null
      }

      event.sender.send('twitch-auth', JSON.stringify(authObj))
    } else {
      authWindow.show()
    }
  }

  authWindow.webContents.on('will-navigate', (event, url) => handleRedirect(url))
  authWindow.webContents.on('did-get-redirect-request', (event, oldURL, newURL) => handleRedirect(newURL))

  authWindow.on('close', () => { authWindow = null })
})

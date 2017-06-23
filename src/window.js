const { BrowserWindow } = require('electron')
const openAboutWin = require('about-window').default
const path = require('path')
const url = require('url')

let win = null

const createWindow = () => {

  let height = process.platform === 'win32' ? 780 : 760

  if (win === null) {
    win = new BrowserWindow({
      width: 1150,
      height,
      minWidth: 1150,
      minHeight: height,
      title: 'Twitch Dashboard',
      icon: './icons/icon@2x.png',
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#8642f4'
    })

    win.loadURL(url.format({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file:',
      slashes: true
    }))

    win.on('closed', () => {
      win = null
    })
  }
}

const getWindow = () => win

const openAboutWindow = () => openAboutWin({
  icon_path: path.join(__dirname, '../icons/icon@2x.png'),
  package_json_dir: path.join(__dirname, '../'),
  bug_report_url: 'https://github.com/jdtzmn/Twitch-Dashboard/issues',
  homepage: 'https://jdtzmn.github.io/Twitch-Dashboard'
})

const toggleAlwaysOnTop = () => {
  if (win) win.setAlwaysOnTop(!win.isAlwaysOnTop())
}

module.exports = {
  getWindow,
  createWindow,
  openAboutWindow,
  toggleAlwaysOnTop
}

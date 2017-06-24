const {app, Menu} = require('electron')
const win = require('./window')

let menu

module.exports.init = () => {
  menu = Menu.buildFromTemplate(getMenuTemplate())
  Menu.setApplicationMenu(menu)
}

const getMenuTemplate = () => {
  let template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => win.createWindow()
        },
        {
          role: 'close'
        },
        { type: 'separator' },
        {
          label: 'Toggle Preview Window',
          accelerator: 'CmdOrCtrl+Alt+P',
          click: () => win.getWindow().webContents.send('activate-preview-window')
        },
        { type: 'separator' },
        {
          label: 'Logout of Twitch',
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => win.getWindow().webContents.send('twitch-logout')
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        {
          label: 'Float on Top',
          type: 'checkbox',
          click: () => win.toggleAlwaysOnTop()
        },
        { type: 'separator' },
        {
          label: 'Developer',
          submenu: [{ role: 'toggledevtools' }]
        }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    // Add app menu if macOS
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'About ' + app.getName(),
          click: () => win.openAboutWindow()
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })

    // Add Window menu (OS X)
    template.splice(2, 0, {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          role: 'minimize'
        },
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      ]
    })
  }

  if (process.platform === 'linux' || process.platform === 'win32') {
    template[2].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'About ' + app.getName(),
        click: () => win.openAboutWindow()
      }
    )
  }

  if (process.platform === 'linux') {
    // Add quit option to Linux file menu
    template[0].submenu.push({
      label: 'Quit',
      click: () => app.quit()
    })
  }

  return template
}

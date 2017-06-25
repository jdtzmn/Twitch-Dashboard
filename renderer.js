const { ipcRenderer } = require('electron')

// hide menubar if windows
if (process.platform === 'win32') window.$('#menubar').addClass('hidden')

// ---------------------------------------
// ----------- AUTHENTICATION ------------
// ---------------------------------------

window.Twitch.login = (options) => {
  if (!options.scope) {
    throw new Error('Must specify list of requested scopes')
  }

  // authentication parameters
  var params = {
    response_type: 'token',
    client_id: window.Twitch._config.clientId,
    redirect_uri: 'https://jdtzmn.github.io/Twitch-Dashboard/',
    scope: options.scope.join(' '),
    force_verify: window.localStorage.getItem('relogin')
  }

  if (!params.client_id) {
    throw new Error('You must call init() before login()')
  }

  // generate authentication url
  var url = window.Twitch.baseUrl + 'oauth2/authorize?' + window.$.param(params)

  // send auth url to main process
  ipcRenderer.send('twitch-login', url)

  // authentication event returned
  ipcRenderer.once('twitch-auth', (event, str) => {
    // set permanent session token
    window.localStorage.setItem('twitch_oauth_session', str)
    window.localStorage.removeItem('relogin')

    // set temporary session token
    window.sessionStorage.setItem('twitch_oauth_session', str)
    window.location.reload()
  })
}

// logout event receieved from main process
ipcRenderer.on('twitch-logout', () => {
  window.localStorage.removeItem('twitch_oauth_session')
  window.Twitch.logout()
  window.localStorage.setItem('relogin', true)
  window.location.reload()
})

// ---------------------------------------
// ------------ NOTIFICATIONS ------------
// ---------------------------------------

// notification polyfill
window.notify = (options) => {
  if (process.platform === 'darwin') {
    ipcRenderer.send('chat-receive', options)
  } else {
    let notification = new window.Notification(options.title || '', options)
  }
}

// chat reply event to be sent to the chat
ipcRenderer.on('chat-reply', (event, data) => {
  window.client.say(window.user.name, '@' + data.to + ' ' + data.reply)
})

// ---------------------------------------
// ----------- PREVIEW WINDOW ------------
// ---------------------------------------

window.togglePreviewWindow = (url) => {
  ipcRenderer.send('toggle-preview-window', url)
}

ipcRenderer.on('activate-preview-window', () => {
  if (streamURL) ipcRenderer.send('toggle-preview-window', streamURL)
})

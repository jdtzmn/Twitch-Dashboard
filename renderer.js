const { ipcRenderer, session } = require('electron')

window.Twitch.login = (options) => {
  if (!options.scope) {
    throw new Error('Must specify list of requested scopes')
  }
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

  var url = window.Twitch.baseUrl + 'oauth2/authorize?' + window.$.param(params)

  ipcRenderer.send('twitch-login', url)

  ipcRenderer.once('twitch-auth', (event, str) => {
    // authentication successful
    if (str) {
      // set permanent session token
      window.localStorage.setItem('twitch_oauth_session', str)
      window.localStorage.removeItem('relogin')

      // set temporary session token
      window.sessionStorage.setItem('twitch_oauth_session', str)
      window.location.reload()
    } else {
      // authentication error
      window.alert('Authentication Unsuccessful, \n Please try again later.')
    }
  })
}

ipcRenderer.on('twitch-logout', () => {
  window.localStorage.removeItem('twitch_oauth_session')
  window.Twitch.logout()
  window.localStorage.setItem('relogin', true)
  window.location.reload()
})

const { ipcRenderer } = require('electron')

window.Twitch.login = (options) => {
  if (!options.scope) {
    throw new Error('Must specify list of requested scopes')
  }
  var params = {
    response_type: 'token',
    client_id: window.Twitch._config.clientId,
    redirect_uri: 'https://jdtzmn.github.io/Twitch-Dashboard/',
    scope: options.scope.join(' ')
  }

  if (!params.client_id) {
    throw new Error('You must call init() before login()')
  }

  var url = window.Twitch.baseUrl + 'oauth2/authorize?' + window.$.param(params)

  ipcRenderer.send('twitch-login', url)

  ipcRenderer.on('twitch-auth', (event, str) => {
    window.sessionStorage.setItem('twitch_oauth_session', str)
    window.location.reload()
  })
}

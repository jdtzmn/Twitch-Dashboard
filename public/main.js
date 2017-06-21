var Twitch, $, tmi, Chart, Hls

const clientId = 'w9kd8t68mh5r8vuupjs6pmbbz9taep'

Twitch.init({ clientId: clientId }, (err, status) => {
  if (err) return console.log(err)

  // check authentication
  if (status.authenticated) {
    $('.main').fadeIn()
    // get user data
    Twitch.api({method: 'user'}, (err, user) => {
      if (err) return console.log(err)

      // initalize channel chat
      $('.chat').prop('src', 'https://twitch.tv/' + user.name + '/chat')

      Twitch.api({method: 'streams/' + user.name}, (err, stream) => {
        if (err) return console.log(err)
        if (stream.stream) {
          // get stream data
          $.getJSON('http://query.yahooapis.com/v1/public/yql?q=select+*+from+json+where+url="http://api.twitch.tv/api/channels/' + user.name + '/access_token?client_id=' + clientId + '"&format=json', (res) => {
            let data = res.query.results.json
            console.log(data)

            // random 6 letter string
            let p = +new Array(6).fill().map((e) => Math.random().toString().slice(2, 3)).join('')

            // fade out 'not streaming' text
            $('.overlay h1').fadeOut()

            // set video src to stream
            if (Hls.isSupported()) {
              $.get('http://cors-anywhere.herokuapp.com/http://usher.twitch.tv/api/channel/hls/' + user.name + '.m3u8?player=twitchweb&token=' + data.token + '&sig=' + data.sig + '&allow_audio_only=true&allow_source=true&type=any&p=' + p, (res) => {
                // get m3u8 url from response
                let url = res.match(/(http:\/\/.*)/)[0]

                // set video source and start playing
                let hls = new Hls()
                hls.loadSource(url)
                hls.attachMedia($('.shown-vid')[0])
                hls.on(Hls.Events.MANIFEST_PARSED, () => $('.shown-vid')[0].play())
              })
            }

            // enable picture-in-picture preview
            let video = $('.hidden-vid')[0]
            $(video).prop('src', 'http://usher.twitch.tv/api/channel/hls/' + user.name + '.m3u8?player=twitchweb&token=' + data.token + '&sig=' + data.sig + '&allow_audio_only=true&allow_source=true&type=any&p=' + p)[0].play()

            if (video.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === 'function') {
              // bind toggle event
              $('.toggle').click(() => {
                video.webkitSetPresentationMode(video.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture')
              })
            } else {
              $('.toggle').disabled = true

              // activate preview button tooltip
              $('[data-toggle="tooltip"]').tooltip()
            }
          })

          // draw up viewer chart
          $('.card.viewers .card-block h1').fadeOut()
          $('#viewers').fadeIn()

          // draw basic line chart
          let chart = $('#viewers')[0]
          let ctx = chart.getContext('2d')
          var liveChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: [0],
              datasets: [
                {
                  label: 'Viewers',
                  backgroundColor: 'rgba(151,187,205,0.2)',
                  borderColor: 'rgba(151,187,205,1)',
                  pointBorderColor: 'rgba(151,187,205,1)',
                  pointBackgroundColor: '#fff',
                  data: [stream.stream.viewers]
                }
              ]
            },
            options: {
              scales: {
                yAxes: [{
                  ticks: {
                    stepSize: 1
                  }
                }]
              }
            }
          })

          let latestLabel = 0

          // set viewer check interval
          setInterval(() => {
            Twitch.api({method: 'streams/' + user.name}, (err, stream) => {
              if (err) return console.log(err)
              if (stream.stream) {
                liveChart.config.data.labels.push(latestLabel += 10)
                liveChart.config.data.datasets[0].data.push(stream.stream.viewers)
                liveChart.update()
              } else {
                window.location.reload()
              }
            })
          }, 10000)
        }
      })

      // channel chat alerts
      let client = new tmi.client({channels: [user.name]})

      client.connect()

      // chat event handler
      client.on('chat', (channel, user, msg, self) => {
        var username = user['display-name'] || user.username

        // get user logo
        Twitch.api({method: 'users/' + user.username}, (err, user) => {
          if (err) return console.log(err)
          notify({
            title: username,
            body: msg,
            icon: user.logo || 'http://bit.ly/1WePcvi'
          }, function (notification, hide) {
            hide(5000)
          })
        })
      })
    })

    // get channel data
    Twitch.api({method: 'channel'}, (err, channel) => {
      if (err) return console.log(err)

      // set stream information
      $('#title').val(channel.status)
      $('#game').val(channel.game)

      // bind update information button event
      $('#update').click(() => updateChannel($('#title').val(), $('#game').val()))
    })

    // bind commercial button events
    $(document).ready(() => {
      $('#30').click(() => commercial(30))
      $('#60').click(() => commercial(60))
      $('#90').click(() => commercial(90))
      $('#120').click(() => commercial(120))
      $('#150').click(() => commercial(150))
      $('#180').click(() => commercial(180))
    })
  } else {
    // fade in login button
    $('.login').fadeIn()

    // set login button event
    $('.twitch-connect').click(() => {
      Twitch.login({
        scope: ['user_read', 'channel_read', 'channel_editor', 'channel_commercial']
      })
    })
  }
})

const updateChannel = (status, game, cb) => {
  Twitch.api({method: 'user'}, (err, user) => {
    if (err) return console.log(err)

    $.ajax({
      url: 'https://api.twitch.tv/kraken/channels/' + user._id,
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json',
        Authorization: 'OAuth ' + Twitch._config.session.token,
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        'channel[status]': status,
        'channel[game]': game
      }
    }).done(cb)
  })
}

const commercial = (duration, cb) => {
  Twitch.api({method: 'user'}, (err, user) => {
    if (err) return console.log(err)
    $.post('https://api.twitch.tv/kraken/channels/' + user.name + '/commercial?duration=' + duration + '&oauth_token=' + Twitch.getToken()).done(cb)
  })
}

const notify = (options, cb) => {
  if (!('Notification' in window)) {
    window.alert('This browser does not support the notifications API.')
  }
  if (window.Notification.permission === 'granted') {
    let notification = new window.Notification(options.title || '', options)
    let hide = (delay) => {
      setTimeout(function () {
        notification.close()
      }, delay || 0)
    }
    cb(notification, hide)
  } else if (window.Notification.permission !== 'denied') {
    window.Notification.requestPermission(() => {
      notify(options, cb)
    })
  }
}

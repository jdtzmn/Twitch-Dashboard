const express = require('express')
const path = require('path')
const app = express()

app.set('view engine', 'pug')

app.use(express.static(path.resolve(__dirname, 'public')))

app.get('/', (req, res) => {
  res.render('index')
})

app.listen(process.env.PORT || 3000, () => console.log('Server running on port 3000'))

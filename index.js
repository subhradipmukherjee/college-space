const express = require('express')
const app = express()
const mongoose = require('mongoose')
const Article = require('./models/article')
const articleRouter = require('./routes/articles')
const methodOverride = require('method-override')
const userRoute = require('./routes/user_route')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const auth= require('./middleware/auth')


////////////////////////////////

const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./src/utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./src/utils/users')
const { nextTick } = require('process')

//const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '/public')


const SESS_NAME = 'sid'
app.use(session({
  name: SESS_NAME,
  secret: 'I dont know the secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/Blog-DB' }),
  cookie: {
      maxAge : 60 * 60 * 1000
  }
}))

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(methodOverride('_method'))

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true
})

const access = (req,res,next)=>{
  if(!req.session.userid){
    next()
  }else {
    res.redirect('/all')
  }
}

app.get('/',access,async(req,res)=>{
  res.render('articles/signup')
})

// app.get('/chat',authcheck,(req,res)=>{
//   console.log(" access value "+ req.access)
//   query = req.params.text
//   res.redirect('http://localhost:4000/'+query);
// })

app.get('/login',access,async(req,res)=>{
  res.render('articles/login')
})
app.get('/logout',auth.authcheck,(req,res)=>{
   req.session.destroy(err=>{
    if(err){
        res.redirect('/dash')
    }
  })   
    res.clearCookie(SESS_NAME)
    res.redirect('/login')
})

app.get('/all',auth.authcheck,async (req, res) => {
  const articles = await Article.find().populate('owner').sort({ createdAt: 'desc' })
  //console.log('owner is '+ articles[0].owner.name)
  res.render('articles/index', { articles: articles, k : req.session.userid})
})

app.use('/articles', articleRouter)
app.use(userRoute)

app.get('/chat',auth.authcheck,(req,res)=>{
  res.sendFile('/Users/subhradipmukherjee/Desktop/node/college-space/public/index.html');
  app.use(express.static(publicDirectoryPath))
  
})

app.get('/open',auth.authcheck,auth.chatauth,(req,res)=>{
  res.sendFile('/Users/subhradipmukherjee/Desktop/node/college-space/public/chat.html');
  app.use(express.static(publicDirectoryPath))
})

app.get('/:something',auth.authcheck,(req,res)=>{
  res.redirect('/all')
})

io.on('connection', (socket) => {
  console.log('New WebSocket connection')

  socket.on('join', (options, callback) => {
      const { error, user } = addUser({ id: socket.id, ...options })    //id: socket.id

      if (error) {
          return callback(error)
      }

      socket.join(user.room)

      socket.emit('other-message', generateMessage('Admin', 'Welcome!'))
      socket.broadcast.to(user.room).emit('other-message', generateMessage('Admin', `${user.username} has joined!`))
      io.to(user.room).emit('roomData', {
          room: user.room,
          users: getUsersInRoom(user.room)
      })

      callback()
  })

  socket.on('sendMessage', (message, callback) => {
      const user = getUser(socket.id)
      const filter = new Filter()

      if (filter.isProfane(message)) {
          return callback('Profanity is not allowed!')
      }
      socket.emit('my-message', generateMessage("You", message))
      socket.broadcast.to(user.room).emit('other-message', generateMessage(user.username, message))
      callback()
  })

  socket.on('sendLocation', (coords, callback) => {
      const user = getUser(socket.id)
      io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
      callback()
  })

  socket.on('disconnect', () => {
      const user = removeUser(socket.id)

      if (user) {
          io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
          io.to(user.room).emit('roomData', {
              room: user.room,
              users: getUsersInRoom(user.room)
          })
      }
  })
})

const port = process.env.PORT
server.listen(port, () => {
  console.log(`Server is up on port ${port}!`)
})
// app.listen(5000,()=>{
//   console.log("server is up on 5000")
// })
const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')

const server = jsonServer.create()
const router = jsonServer.router('./database.json')
const userdb = JSON.parse(fs.readFileSync('./database.json', 'UTF-8'))

server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use(jsonServer.defaults());


const SECRET_KEY = '123456789'

const expiresIn = '1h'

// Create a token from a payload 
function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn })
}

// Verify the token 
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ? decode : err)
}

// Check if the user exists in database
function isAuthenticated({ email, password }) {
  return userdb.users.data.findIndex(user => user.email === email && user.password === password) !== -1
}

// Register New User
server.post('/auth/register', (req, res) => {
  console.log("register endpoint called; request body:");
  console.log(req.body);
  const { email, password, name, avatar, role } = req.body;

  if (isAuthenticated({ email, password }) === true) {
    const status = 401;
    const message = 'Email and Password already exist';
    res.status(status).json({ status, message });
    return
  }

  fs.readFile("./database.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({ status, message })
      return
    };

    // Get current users data
    var data = JSON.parse(data.toString());

    // Get the id of last user
   
    var last_item_id = data.users.data[data.users.data.length - 1].id;
    console.log(last_item_id)

    //Add new user
    data.users.data.push({ id: last_item_id + 1, email: email, password: password, name: name, avatar: avatar, role: [role]  }); //add some data
    var writeData = fs.writeFile("./database.json", JSON.stringify(data), (err, result) => {  // WRITE
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      }
    });
  });

  // Create token for new user
  const token = createToken({ email, password })
  console.log("Access Token:" + token);
  res.status(200).json({ token })
})

// Edit User
server.put('/user/:id', (req, res) => {
  console.log("Edit endpoint called; request body:");
  console.log(req.body);
  const { email, password, name, avatar, role } = req.body;

  if (isAuthenticated({ email, password }) === true) {
    const status = 401;
    const message = 'Email and Password already exist';
    res.status(status).json({ status, message });
    return
  }

    // Get the id of last user
    const user = userdb.users.data.find(user => user.id === parseInt(req.params.id))
    if (!user) {
      const status = 404;
      const message = 'User not found';
      res.status(status).json({ status, message });
      return
    }

    const userEdit = user

    if(user) {
      email ? userEdit.email = email : user.email = email
      password ? userEdit.password = password : user.password = password
      name ? userEdit.name = name : user.name = name
      avatar ? userEdit.avatar = avatar : user.avatar = avatar
      role ? userEdit.role = role : user.role = role
    }
  

    // Write updated user to database
    var writeData = fs.writeFile("./database.json", JSON.stringify(userdb), (err, result) => {  // WRITE
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      }
    });

    // Create token for new user
    const token = createToken({ user })
    console.log("Access Token:" + token);
    res.status(200).json({ token })

    

})

// Login to one of the users from ./users.json
server.post('/auth/login', (req, res) => {
  console.log("login endpoint called; request body:");
  console.log(req.body);
  const { email, password,  name, role, avatar } = req.body;
  if (isAuthenticated({ email, password }) === false) {
    const status = 401
    const message = 'Incorrect email or password'
    res.status(status).json({ status, message })
    return
  }
  const users = userdb.users.data.find(user => user.email === email && user.password === password)

  info = {
    name: users.name,
    role: users.role,
    avatar: users.avatar,
    email: email,
    password: password
  }
  const token = createToken(info)
  console.log("Access Token:" + token);
  res.status(200).json({ token })
})

//criar endpoint para verificar se o token é valido
server.post('/verify', (req, res) => {
  console.log("verify endpoint called; request body:");
  console.log(req.body);
  const { token } = req.body;
  try {
    const decoded = verifyToken(token)
    console.log("Decoded Token:" + decoded);
    res.status(200).json(decoded)
  } catch (err) {
    const status = 401
    const message = 'Invalid token'
    res.status(status).json({ status, message })
  }
})



server.post('/logout', function (req, res) {
  res.json({ auth: false, token: null });
})



server.use(router)

server.listen(8000, () => {
  console.log('Run Auth API Server')
})
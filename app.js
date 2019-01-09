const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./models/user')
const { body, validationResult } = require('express-validator/check')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json()) 
app.use(bodyParser.raw()) 
app.use(cors())



app.post('/api/register', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid email')
        .custom((value, {req}) => {
            return User.findOne({email: value}).then(UserDoc => {
                if (UserDoc) {
                    return Promise.reject('Email Adress already exists')
                }
            })
        }),
    body('password').trim().isLength({min:4})
],(req,res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed')
        error.statusCode = 422
        throw error
    }
    const email = req.body.email
    const password = req.body.password
    const name = req.body.name
    bcrypt.hash(password, 12)
        .then(hashedPw => {
            const user = new User({
                email: email,
                password: hashedPw,
                name: name
            })
            return user.save()
        })
        .then(result => {
            res.status(201).json({message:'User succesfully created', userId: result._id})
        })
        .catch(err => {
            throw err
        })
})

app.post('/api/login',(req,res) => {
    const email = req.body.email
    const password = req.body.password
    let loadedUser
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                const error = new Error('User does not exist')
                error.statusCode = 401
                throw error
            }
            loadedUser = user
            return bcrypt.compare(password, user.password)
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password')
                error.statusCode = 401
                throw error
            }
            const token = jwt.sign({
                email: loadedUser.email,
                name: loadedUser.name,
                userId : loadedUser._id.toString()
            }, 'tsaimelemonistompalkoni', {expiresIn: '10m'})
            res.status(200).json({token: token,name:loadedUser.name, userId: loadedUser._id.toString()})
        })
        .catch(err => {
            const error = new Error('Database Error')
            error.statusCode = 500
            res.send(error) 
        })
})






const PORT = process.env.PORT || 5000;

mongoose.connect('mongodb+srv://geobako:1234@reacttest-v11xo.mongodb.net/test?retryWrites=true',{ useNewUrlParser: true })
    .then(result => {
        app.listen(PORT,() => console.log('ook!'))
    }).catch(err => console.log(err))
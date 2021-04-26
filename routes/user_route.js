const express = require('express')
const User = require('../models/users')
const Article = require('../models/article')
//const auth = require('../middleware/auth')
//const multer = require('multer')
const router = new express.Router()

router.post('/users/signup', async (req,res)=>{                            // creating new user
    console.log("hi")
    const user = new User(req.body)
    try {
        const n_user = await user.save()
        req.session.userid = n_user._id
        req.session.username = user.name
        req.auth =true
        console.log(req.session)
        //const token = await user.authtoken()
        //user.tokens = user.tokens.concat({token})
        //await user.save()
        //res.status(201).send({user,token}) // .send({user,token}) is shorthands for .send({ user : user, token: token}) where left side 'user' , 'token' are object properties
        res.redirect('/all')
    } catch(err) {
        res.status(500).send(err)
    }
})

router.post('/users/login', async (req,res)=>{                      //Loging in
    try{
     const user = await User.login(req.body.email,req.body.password,res)
     //const token = await user.authtoken()
     //user.tokens = user.tokens.concat({token})
     //await user.save()
     if(user == false){
         return res.redirect('/login')
     }
     req.session.userid = user._id
     req.session.username = user.name
     req.auth =true
     res.redirect('/all')
     
    } catch(err){
 
     res.status(400).send('can not login')
    } 
 })



module.exports = router
const User = require('../models/users')

exports.authcheck = async(req,res,next) =>{
    if(req.session.userid)
    {
      const n_user = User.findById(req.session.id)
      req.user = n_user
      //res.locals.access= true
      //req.locals.access=true
      next()
    }else{
        console.log("issue hai "+ req.url )
        res.redirect('/login')
    }

}

exports.chatauth = async(req,res,next)=>{
  if(req.query.username && req.query.room)
  {
     if(req.query.username == req.session.username)
     {
       next()
     }else{

       res.redirect('/chat')
     }
  }else{
    res.redirect('/all')
  }
}

 
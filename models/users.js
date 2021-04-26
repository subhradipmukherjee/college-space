const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const userschema = new mongoose.Schema({
    name : {
       type: String,
       required:true,
       trim: true
    },
    email : {
        type : String,
        unique : true,
        required : true,
        trim: true,
        lowercase : true,
        validate(value) {
            if(!validator.isEmail(value))
             throw new Error('Incorrect mail id')

        }

    },
    batch : {
        type: String,
        default: 1,
        validate(value) {
            if(value < 1)
            throw new Error('Not allowed')

        }
    },
    year : {
        type: Number,
        required:true

    },
    password : {
        type : String,
        required: true,
        trim : true,
        validate(value) {
         if(value.length <= 6)
          throw new Error('Password mmust contain more than 6 letters')

         if(value.toLowerCase() == 'password') 
            throw new Error('Password can not be the word password')             
        }

    },

    tokens : [{
        token : {
            type: String,
            required: true
        }
    }],
     
    avatar : {
        type : Buffer
    }

},{
    timestamps : true
})

userschema.virtual('article',{    /* virtual menas for this userschema we are creating a virtual field which is not going to be stored 
                                in the database. It is just for mongoose reference */
    ref : 'Article',             
    localField : '_id',         /*Here the virtual field tasks actually refferences to the Task document(table). The localfield _id is a relationship between the _id field of userschema and the owner field of the Task document which is actually user id. */
    foreignField : 'owner'      //In simple words the owner attribute of Task document is a foreign key referencing to the _id attribute of User Document
})                              // The localField and foreignField are not random attributes, thses two are predefined attributes and should be included when a Virtual field is made to reference other document

// userschema.methods.toJSON = function (){
//     const user = this
   
//     // const user_info = {
//     //     name : user.name,
//     //     age : user.age,            // Method 1 of hinidng crusial info ike password and token by not adding it it new user_info object
//     //     email : user.email
//     // }

//     // or 

//     const userObject = user.toObject()
//     delete userObject.password           // Method 2 is to use the  .toObject() method to get the raw object from this operator and use delete to delete password and tokens propertry  
//     delete userObject.tokens

    

//     return userObject
// }


userschema.methods.authtoken = async function (){                             // functions with userschema.methods are for particular instances of that schema
    const user = this
    const token = jwt.sign({id : user._id.toString()},process.env.JWT_SECRET)
    return token
}


userschema.statics.login = async (email,password,res) => {                          // functions with userschema.statics are for entire schema as a whole
    const user = await User.findOne({email})
    if(!user){
        //throw new Error('Unable to login')
        return false
    }
    const isvalid = await bcrypt.compare(password,user.password)
    if(!isvalid){
        //throw new Error('Unable to login')   
        return false
    }

    return user
}

userschema.pre('save', async function (next){       // arrow function wont work here
    const user = this                               // This userschema.pre is a middleware taht runs every time a userschema is saved 
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password,8)
    }

next()
})

userschema.pre('remove', async function(next){        // This userschema.pre is also a middleware that runs every time a userschema is removed
    const user = this  
    await Task.deleteMany({owner: user._id})
    next()
})
const User = mongoose.model('Users',userschema)

module.exports = User
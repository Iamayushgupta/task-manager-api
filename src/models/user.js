const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcrypt")
const jwt = require ("jsonwebtoken")
const Task = require("./task")

const userSchema =new mongoose.Schema({
    name : {
        type :String,
        trim : true,
        required :true
    },
    email :{
        unique:true,
        type : String , 
        required : true , 
        lowercase: true , 
        trim : true ,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Not a valid email")
            }
        }
    },
    age : {
        type : Number,
        default : 0,
        validate(value){
            if(value<0){
                throw new Error("Age must be positive")
            }
        }
    },
    password : {
        type :String ,
        minlength : 6 , 
        required :true,
        trim : true , 
        validate(value){
            if (value.toLowerCase().includes("password")){
                throw new Error("Password must not contain 'password'")
            }
        }
    },

    tokens : [{
        token : {
            type:String,
            required :true 
        }
    }],
    avatar:{
        type:Buffer
    }
},{
    timestamps:true
})

userSchema.virtual('tasks', {
    ref: 'Task', 
    localField: '_id',   //Which field has been referenced with
    foreignField: 'owner' // Name of field set in Foreign(Task) Object
})

userSchema.statics.findByCredentials = async(email,password)=>{
    const user = await User.findOne({email})
    if(!user){
        throw new Error("Unable to Login")
    }
    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error("Unable to Login")
    }
    return user
}

userSchema.methods.generateAuthToken = async function(){
    const user =this 
    const token = jwt.sign({_id : user._id.toString()} , process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({token})
    await user.save()
    return token

}

// We need call this function anywhere , it automatically updated user object
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

userSchema.pre("save" , async function(next){
    const user= this
    if(user.isModified("password")){
        user.password= await bcrypt.hash(user.password,8)
    }
    next()
})

userSchema.pre("remove", async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model("User" , userSchema)

module.exports = User
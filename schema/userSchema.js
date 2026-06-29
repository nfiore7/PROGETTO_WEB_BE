const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const userSchema =new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique:true,
    },
    password:{
        type: String,
        required: true,
    },
    name:{
        type: String,
        required: true,
    },
    lastname:{
        type: String,
        required: true,
    },
    address:String,
    city:String,
    age: Number,
    email: {
        type: String,
        required: true,
        unique:true,
    },
    phone: String,
    balance:{
        type: Number,
        required: true,
        default:0.0,
    },
    role:{
        type: String,
        enum: ['admin', 'customer', 'dealer'],
        default: "customer",
        required: true
    },
    dealerData:{
        pIva:{
            type: String,
            unique:true,
            sparse:true
        },
        companyAddress: String,
        profession:{
            type: String,
        }
    },
    services:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Services',
    }],
    orders:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Orders"
    }],
    },{timestamps:true}
)

userSchema.pre("save", async function() {
    if (!this.isModified("password")) return ;
    try {
       const hash = await bcrypt.hash(this.password, 10)
        this.password = hash

    }catch(err){
        console.log(err);
    }
})

userSchema.methods.comparePassword = async function(candidatePassword){
    return bcrypt.compare(candidatePassword, this.password);

}

module.exports = mongoose.model('Users',userSchema);

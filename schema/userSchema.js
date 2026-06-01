/**Qui modelliamo lo schema dei vari utenti i quali possono essere sia clienti che fornitori */

const mongoose = require('mongoose');

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
    isDealer:{
        type: Boolean,
        default: false,
    },
    dealerData:{
        pIva:{
            type: String,
            unique:true,
        },
        companyAddress: String,
        profession:{
            type: String,
        },
        dealerBalance: {
            type:Number,
            default: 0.0},
    },
    services:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Services',
    }],
    },{timestamps:true}
)
module.exports = mongoose.model('Users',userSchema);


const mongoose = require('mongoose');

const utenteSchema =new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique:true,
    },
    password:{
        type: String,
        required: true,
    },
    nome:{
        type: String,
        required: true,
    },
    eta: Number,
    telefono: String,
    pIva: String,

    professione:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Professione',
    }],

    servizi:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Servizi',
    }],

    saldo:{
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        default:0.0,
    }

    },{

    timestamps:true,
})
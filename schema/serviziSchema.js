const mongoose = require('mongoose');
const serviziSchema = new mongoose.Schema({
    professioneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professione',
        required: true,
    },

    titolo: {
        type: String,
        required: true,
    },

    descrione: {
        type: String,
        required: true,
    },

    prezzo:{
        type: mongoose.Schema.Types.Decimal128,
    },

    giorniConsegna:{
        type:Number,
        required: true,
    },

    commenti:[{
        type: String,
    }],

})

module.exports=mongoose.model('Servizi',serviziSchema);


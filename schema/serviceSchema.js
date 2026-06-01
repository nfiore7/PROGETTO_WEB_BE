/**Qui modelliamo lo schema dei servizi offerti dai nostri fornitori */
const mongoose = require('mongoose');


const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    cost: Number,

    deliveryDays:{
        type:String,
        required: true,
    },

    dealer:{
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
        required: true,
    },

    comments:[{
        user:{
            type : mongoose.Schema.Types.ObjectId, ref: 'Users'
        },
        type: String,
        data:{type: Date, default: Date.now},
    }],

})

module.exports=mongoose.model('Services',serviceSchema);


/**Qui modelliamo lo schema degli ordini, con il relativo stato e il pagamento **/


const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    dealer:{
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    customer:{
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    service:{
        type: mongoose.Types.ObjectId,
        ref: 'Services',
        required: true
    },
    finalCost:{
        type: Number,
        required: true
    },
    serviceName:{
        type: String
    },
    orderDate:{
        type: Date,
        required: true,
        default: Date.now
    },
    orderStatus:{
        type: String,
        enum: ['in corso', 'completato', 'annullato'],
        default: 'in corso'
    },
    paymentStatus:{
        type: String,
        enum: ['da effettuare','effettuato', 'annullato', "rimborsato"],
        default: 'da effettuare'
    }

})

module.exports = mongoose.model("Orders",orderSchema)
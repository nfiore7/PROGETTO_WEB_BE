const mongoose=require("mongoose");
const professioneSchema=new mongoose.Schema({
    categoria:{
        type:String,
        required:true,
        enum:[
            'Informnatica e Tech',
            'Design e Grafica',
            'Scrittura e Traduzione',
            'Video e Audio',
            'Altro'
        ],
        default: 'Altro',
    },
    descrizione:{
        type:String,
    }
})
module.exports=mongoose.model('Professione',professioneSchema);

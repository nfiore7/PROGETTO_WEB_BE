/**Qui modelliamo lo schema delle professioni dei vari fornitori  */

const mongoose=require("mongoose");


const professionSchema=new mongoose.Schema({
    category:{
        type:String,
        required:true,
        enum:[
            'Informatica e Tech',
            'Design e Grafica',
            'Scrittura e Traduzione',
            'Video e Audio',
            'Altro'
        ],
        default: 'Altro',
    },
    description:{
        type:String,
    },
    user:{
        type : mongoose.Types.ObjectId, ref : 'Users',
    }
})
module.exports=mongoose.model('Professions',professionSchema);

const express = require("express")
const Service = require("../schema/serviceSchema")
const User = require("../schema/userSchema")
const userController = require("./userController")

module.exports = {
    createService: async (req, res) => {
        const data= req.body
        const id = req.params._id

        const user = await User.findById(id)
        if(!user){
            return res.status(404).json({message:"Utente non trovato"})
        }
        if(!user.isDealer){
            return res.status(403).json({message:"L'utente non è un dealer"})
        }
        try{
            const newService = new Service({
                name: data.name,
                description: data.description,
                cost: data.cost,
                dealer: id
            })
            await newService.save()
            user.services.push(newService._id)
            await user.save()
            return res.status(201).json({message:"Servizio creato con successo"})
        }catch (err){
            res.status(500).json({message:"Errore interno del server"})
        }
    },

    updateService: async (req, res) => {
        const id = req.params._id
        const serviceId = req.params.serviceId

        const user = await userController.getUserById(id)
        if(!user){
            return res.status(404).json({message: "Utente non trovato"})
        }

        if(!user.isDealer){
            return res.status(403).json({message: "Utente non è un dealer"})
        }

        const {...updates} = req.body
        try{
            const service = await Service.findById(serviceId)
            if(!service){
                return res.status(404).json({message:"Servizio non trovato"})
            }
            service.set(updates)
            const newService = await service.save()
            res.status(200).json({message:"Servizio modificato con successo", service: newService})
        }catch(err){
            res.status(500).json({message:"Errore interno del server"})
        }
    },

    addComment: async(req,res)=>{
        const data = req.body
        const userId = req.params._id
        const serviceId = req.params.serviceId
        const user = await User.findById({_id: userId})
        const service = await Service.findById({_id: serviceId})


        if(!service){
            return res.status(404).json({message:"Servizio non trovato"})
        }

        if(!user){
            return res.status(404).json({message: "Utente non trovato"})
        }

        try{
            const comment = {
                user: userId,
                comment: data.comments.comment,
                data: data.comments.data || Date.now()
            }
            service.comments.push(comment)
            await service.save()
            res.status(200).json({message:"Commento aggiunto con successo"})
        }catch (err){
            res.status(500).json({message:"Errore interno del server", error:err})
        }
    },

    updateComment: async (req, res)=>{
        const data = req.body;
        const commentId = req.params.commentId;
        const userId = req.params._id

        try{
            const service = await Service.findOne({"comments._id":commentId})
            if(!service){
                return res.status(404).json({message:"Servizio o commento non trovato"})
            }
            const comment = service.comments.id(commentId)
            if (comment.user.toString() !== userId){
                return res.status(403).json({message:"Non sei autorizzato a modificare questo commento"})
            }
            comment.comment = data.comments.comment
            await service.save()
            return res.status(200).json({message:"Commento modificato con successo"})

        }catch(err){
            res.status(500).json({message:"Errore interno del server", error:err.message})
        }

    },
    getComments : async function(req,res){
        const serviceId = req.params.serviceId

        try{
            const service = await Service.findById(serviceId)
            const comments = service.comments
            if (comments.length === 0){
                return res.status(404).json({message: "Commento inesistente"});
            }
            return res.status(200).json(comments);
        }
        catch(err){
            return res.status(500).json({message: "Qualcosa è andato storto" + err.message})
        }
    }


}
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
        console.log(data)
        const userId = req.params._id
        const serviceId = req.params.serviceId
        const user = await User.findById({_id: userId})
        const service = await Service.findById({_id: serviceId})
        console.log(req.params)


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
            res.status(200).json({message:"Commento modificato con successo"})
        }catch (err){
            res.status(500).json({message:"Errore interno del server", error:err})
        }

    }


}
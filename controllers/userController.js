const express = require('express')
const User = require('../schema/userSchema')
module.exports= {
     createUser: async function (req, res) {
        const data = req.body;
        try {
            const existingUser = await User.findOne({email: data.email})
            existingUser ? res.status(409).json({message: "Utente gia registrato"}) :
                newUser = new User({
                    username: data.username,
                    password: data.password,
                    name: data.name,
                    lastname: data.lastname,
                    address: data.address,
                    city: data.city,
                    age: data.age,
                    email: data.email,
                    phone: data.phone,
                    balance: data.balance,
                    role: data.role,
                    dealer: data.dealerData,
                    services: data.services,
                })
            await newUser.save()
            res.status(201).json({message: "Utente registrato"})
        } catch (err) {
            res.status(500).json({message: "Qualcosa è andato storto" + err})
        }

    },
    getAllUsers: async function (req, res) {
         try {
             const users = await User.find()
             users? res.status(200).json(users) : res.status(404).json({message: "Nessun utente trovato "})
         }
         catch (err) {
             res.status(500).json({message: "Qualcosa è andato storto" + err})
         }
    },

    getAllDealers: async function(req,res){
         try {
             const dealers = await User.findMany({role: req.params.role})
             dealers ? res.status(200).json(dealers) : res.status(404).json({message: "Nessun fornitore trovato"})
         }
         catch (err) {
             res.status(500).json({message: "Qualcosa è andato storto" + err})
         }
    },

    getUser : async function(req,res){
        const id = await req.params._id
        try{
         const user = await User.findById({_id: id})
             user ? res.status(200).json(user) : res.status(404).json({message: "Utente inesistente"})
         }
         catch(err){
             res.status(500).json({message: "Qualcosa è andato storto" + err})
         }
    },

    updateUser: async function (req,res){
        const data = await req.body
        const id = await req.params._id
        try {
            const user = await User.findById({_id: id})
            if (!user) res.status(404).json({message: "Utente insesistente"})
            else {
                await User.updateOne(
                    {_id: req.params._id},
                    {$set: data})
                res.status(200).json({message: "Modifica effettuata con successo"})
            }
        }
     catch(err){ res.status(500).json({message: "Qualcosa è andato storto" + err})
        }
    }

}

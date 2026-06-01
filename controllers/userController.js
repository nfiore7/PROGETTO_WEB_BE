const express = require('express')
const User = require('../schema/userSchema')

module.exports= {
     createUser: async function (req, res) {
        const data = req.body;
        try {
            const existingUser = await User.findOne({email: data.email})
            if(existingUser) {
                return res.status(409).json({message: "Utente gia registrato"})
            }
                
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
            });
            
            await newUser.save()
            return res.status(201).json({message: "Utente registrato"})
        } catch (err) {
            return res.status(500).json({message: "Qualcosa è andato storto" + err})
        }
    },

    getAllUsers: async function (req, res) {
        try {
             const users = await User.find()
                if(users.length !==0) { 
                    res.status(200).json(users)
                }
                else {
                res.status(404).json({message: "Nessun utente trovato "})
                }
            }
        catch (err) {
                res.status(500).json({message: "Qualcosa è andato storto" + err})
        }
    },

    getAllDealers: async function(req,res){
         try {
             const dealers = await User.find({role: "dealer"})
             if(dealers.length !==0) { 
                res.status(200).json(dealers)
            }
              else {
                res.status(404).json({message: "Nessun fornitore trovato"})
            }
         }
         catch (err) {
             res.status(500).json({message: "Qualcosa è andato storto" + err})
         }
    },

    getUser : async function(req,res){
        const id = req.params._id
        try{
         const user = await User.findById({_id: id})
             if(!user){
                return res.status(404).json({message: "Utente inesistente"});
                }
             return res.status(200).json(user);
         }
         catch(err){
             return res.status(500).json({message: "Qualcosa è andato storto" + err})
         }
    },
    getUserByProfession : async function(req,res){
         const profession = req.params.profession.toUpperCase();
         try{
            const user = await User.find({"dealerData.profession": profession})
             if(user.length ===0 ){
                return res.status(404).json({message: "Nessun professionista trovato"});
             }
            return res.status(200).json(user);
    }catch (err){
             res.status(500).json({message: "Qualcosa è andato storto" + err})
         }
    },


    updateUser: async function (req,res){
        const data = req.body
        const id = req.params._id
        try {
            const user = await User.findById({_id: id})
            if (!user) {return res.status(404).json({message: "Utente non trovato"})}
            else {
                await User.updateOne(
                    {_id: req.params._id},
                    {$set: data})
                return res.status(200).json({message: "Modifica effettuata con successo"})
            }
        }
     catch(err){ res.status(500).json({message: "Qualcosa è andato storto" + err})
        }
    }

}

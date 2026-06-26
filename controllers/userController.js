const express = require('express')
const User = require('../schema/userSchema')
const jwt = require('jsonwebtoken')


module.exports= {
     createUser: async function (req, res) {
        const data = req.body;
        try {
            const existingUser = await User.findOne({email: data.email})
            if(existingUser) {
                return res.status(409).json({message: "Utente gia registrato"})
            }

                
            const newUser = new User({
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
                role: data.role || 'customer',
                dealerData: data.dealerData,
                services: data.services,
            });
            
            await newUser.save()
            const token = jwt.sign(
                {
                    id: newUser._id,
                    role: newUser.role,
                    name: newUser.name,
                    lastname: newUser.lastname,
                    username: newUser.username,
                },
                process.env.JWT_SECRET,
                {expiresIn: '24h'}
            )
            res.setHeader("Authorization", `Bearer ${token}`);
            
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
             const dealers = await User.find({role: 'dealer'})
             if(dealers.length) {
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
        const id = req.params._id
        const {password, ...updates} = req.body;

        try {
            const user = await User.findById({_id: id})
            if (!user) {return res.status(404).json({message: "Utente non trovato"})}
            user.set(updates)


            if(password){
                user.password = req.body.password
            }
            const newUser = await user.save()
            res.status(200).json({message: "Utente modificato con successo", newUser})
        }
     catch(err){ res.status(500).json({message: "Qualcosa è andato storto" + err})
        }
    },

    deleteUser: async function (req,res){
        const id = req.params._id
        const user = await User.findById({_id: id})
        if(!user){
            return res.status(404).json({message: "Utente non trovato"})
        }
        await User.findByIdAndDelete(id)
        return res.status(200).json({message: "Utente eliminato con successo"})
    }



}

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
            res.status(500).json({message: "Qualcosa è andato storto" + err},)
        }
    }
}

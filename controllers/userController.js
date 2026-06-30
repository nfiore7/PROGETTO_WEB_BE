
const User = require('../schema/userSchema')
const jwt = require('jsonwebtoken')
const Service = require("../schema/serviceSchema");
const Order = require("../schema/orderSchema");
const bcrypt = require("bcrypt");


module.exports= {
     createUser: async function (req, res) {
        const data = req.body;
        try {
            const existingUser = await User.findOne({email: data.email})
            if(existingUser) {
                return res.status(409).json({message: "Utente gia registrato"})
            }
            const existingUsername = await User.findOne({username: data.username})
            if(existingUsername) {
                return res.status(409).json({message: "Username già in uso"})
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
                role: data.role || 'customer',
                dealerData: data.dealerData,
            });
            
            await newUser.save()

            const payload = {
                id: newUser._id,
                role: newUser.role,
                name: newUser.name,
                lastname: newUser.lastname,
                username: newUser.username,
            }

            const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })
            const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })

            res.setHeader("Authorization", `Bearer ${accessToken}`)
            return res.status(201).json({ message: "Utente registrato", refreshToken })
        } catch (err) {
            if (err.name === 'ValidationError') {
                const firstError = Object.values(err.errors)[0]
                if (firstError.kind === 'minlength' && firstError.path === 'password') {
                    return res.status(400).json({ message: `La password deve essere di almeno ${firstError.properties.minlength} caratteri` })
                }
                return res.status(400).json({ message: firstError.message })
            }
            return res.status(500).json({message: "Qualcosa è andato storto" + err.message})
        }
    },

    getAllDealers: async function(req,res){
         try {
             const dealers = await User.find({role: 'dealer'}).select("-password")
             return res.status(200).json(dealers)
         }
         catch (err) {
             res.status(500).json({message: "Qualcosa è andato storto" + err.message})
         }
    },

    getUser : async function(req,res){
        const id = req.params._id
        try{
         const user = await User.findById({_id: id}).select("-password")
             if(!user){
                return res.status(404).json({message: "Utente inesistente"});
                }
             return res.status(200).json(user);
         }
         catch(err){
             return res.status(500).json({message: "Qualcosa è andato storto" + err.message})
         }
    },

    updateUser: async function (req,res){
        const id = req.params._id
        if(req.user.id !== id){
            return res.status(403).json({message: "Utente non autorizzato"})
        }
        const {oldPassword,newPassword,balance, ...updates} = req.body;

        try {
            const user = await User.findById({_id: id})
            if (!user) {return res.status(404).json({message: "Utente non trovato"})}
            if(user.role === 'dealer' && updates.role === 'customer'){
                const services = await Service.find({dealer: id})
                const servicesIds = services.map(service => service.id)

                const activeOrders = await Order.find({
                    service:{$in: servicesIds},
                    orderStatus:"in corso"
                })
                for(const order of activeOrders){
                    if(order.paymentStatus === "effettuato"){
                        const customer = await User.findById(order.customer)
                        if(customer){
                            customer.balance += order.finalCost
                            await customer.save()
                        }
                        order.paymentStatus = "rimborsato"
                    }
                    order.orderStatus = "annullato"
                    await order.save()
                }
                await Service.deleteMany({dealer: id})
                updates.services=[]
                updates.dealerData=null
            }

            user.set(updates)

            if(balance){
                user.balance +=balance
            }

            if (oldPassword && newPassword) {
                const match = await bcrypt.compare(oldPassword, user.password)
                if (!match) {
                    return res.status(400).json({ message: "La vecchia password non è corretta" })
                }
                user.password = newPassword
            }

            const newUser = await user.save()
            const{password: _,...safeUser} = newUser.toObject()
            res.status(200).json({message: "Utente modificato con successo", newUser: safeUser})
        }catch(err) {
             if (err.name === 'ValidationError') {
                 const firstError = Object.values(err.errors)[0]
                 if (firstError.kind === 'minlength' && firstError.path === 'password') {
                     return res.status(400).json({message: `La nuova password deve essere di almeno ${firstError.properties.minlength} caratteri`})
                 }
                 return res.status(400).json({message: firstError.message})
             }
             return res.status(500).json({message: "Qualcosa è andato storto: " + err.message})
        }
    },

    refreshToken: async function (req, res) {
        const { refreshToken } = req.body
        if (!refreshToken) return res.status(401).json({ message: "Refresh token mancante" })

        try {
            // Verifica firma e scadenza con il segreto dedicato al refresh
            const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

            // Emette solo il nuovo access token — il refresh token rimane lo stesso
            const accessToken = jwt.sign(
                {
                    id: payload.id,
                    role: payload.role,
                    name: payload.name,
                    lastname: payload.lastname,
                    username: payload.username,
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            )

            return res.status(200).json({ accessToken })
        } catch (err) {
            // Token scaduto o firma non valida
            return res.status(403).json({ message: "Refresh token non valido o scaduto" })
        }
    },

    deleteUser: async function (req,res){
        const id = req.params._id
        if(req.user.id !== id){
            return res.status(403).json({message: "Utente non autorizzato"})
        }
        try{

            const user = await User.findById({_id: id})
            if(!user){
                return res.status(404).json({message: "Utente non trovato"})
            }
            if(user.role === 'dealer'){
                const services = await Service.find({dealer: id})
                const servicesIds = services.map(service => service.id)

                const activeOrders = await Order.find({
                    service:{$in: servicesIds},
                    orderStatus:"in corso"
                })
                for(const order of activeOrders){
                    if(order.paymentStatus === "effettuato"){
                        const customer = await User.findById(order.customer)
                        if(customer){
                            customer.balance += order.finalCost
                            await customer.save()
                        }
                        order.paymentStatus = "rimborsato"
                    }
                    order.orderStatus = "annullato"
                    await order.save()
                }

                await Service.deleteMany({dealer: id})

            }
            if(user.role === 'customer'){
                const pendingOrders = await Order.find({
                    customer: id,
                    orderStatus:"in corso",
                    paymentStatus:"da effettuare"
                })
                for(const order of pendingOrders){
                    order.orderStatus = "annullato"
                    await order.save()
                }
            }
            await User.findByIdAndDelete(id)
            return res.status(200).json({message: "Utente eliminato con successo"})
        }catch(err){
            return res.status(500).json({message: "Errore interno del server"})
        }

    }



}

const express = require('express')
const User = require('../schema/userSchema')
const Order = require('../schema/orderSchema')

const jwt = require('jsonwebtoken')

module.exports = {
    createOrder: async function (req, res) {
        const { serviceId } = req.body
        const costumerId = req.user.id

        try {
            const service = await Service.findById(serviceId)
            if (!service) return res.status(404).json({ message: "Servizio non trovato" })

            //SAVIO HA SENSO CONTROLLARE SE NESSUN FORNITORE PUO ORDINARE ?
            //if (service.dealer.toString() === costumerId) {  
            // return res.status(403).json({ message: "Non puoi ordinare un tuo servizio" })
            //}
            const newOrder = new Order({
                dealer: service.dealer,
                costumer: costumerId,
                service: serviceId,
                finalCost: service.cost
            })

            await newOrder.save()
            return res.status(201).json({ message: "Ordine creato con successo", order: newOrder })

        } catch (err) {
            return res.status(500).json({ message: "Errore interno del server", error: err.message })
        }
    },

    getOrder: async function (req, res) {
        const { orderId } = req.params
        const userId = req.user.id

        try {
            const order = await Order.findById(orderId)
                .populate("service", "name cost")
                .populate("dealer", "username name")
                .populate("costumer", "username name")

            if (!order) return res.status(404).json({ message: "Ordine non trovato" })

            if (order.dealer._id.toString() !== userId && order.costumer._id.toString() !== userId) {
                return res.status(403).json({ message: "Non autorizzato" })
            }

            return res.status(200).json(order)

        } catch (err) {
            return res.status(500).json({ message: "Errore interno del server", error: err.message })
        }
    },

    getUserOrders: async function (req, res) {
        const userId = req.user.id
        try {
            const orderCustomer = await Order.find({ costumer: userId })
            const orderDealer = await Order.find({ dealer: userId })

            if (orderCustomer.lenght === 0 || orderDealer.lenght === 0) return res.status(404).json({ message: "Ordine non trovato" })

            return res.status(200).json({
                asCustomer: ordersCustomer,
                asDealer: ordersDealer
            })
        }catch (err) {
            return res.status(500).json({ message: "Errore interno del server", error: err.message })
        }
        
    }
}

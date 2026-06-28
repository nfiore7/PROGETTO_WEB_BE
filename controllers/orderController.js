const Order = require('../schema/orderSchema')
const Service = require('../schema/serviceSchema')
const User = require('../schema/userSchema')

module.exports = {
    createOrder: async function (req, res) {
        const {serviceId} = req.body
        const  customerId = req.user.id

        try {
            const service = await Service.findById(serviceId)
            if (!service) return res.status(404).json({ message: "Servizio non trovato" })
            if (customerId === service.dealer){
                return res.status(403).json({message: "Non sei autorizzato"})
            }

            const newOrder = new Order({
                dealer: service.dealer,
                customer: customerId,
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
        const orderId = req.params._id
        const userId = req.user.id
        try {
            const order = await Order.findById(orderId)
                .populate("service", "name cost")
                .populate("dealer", "username name lastname")
                .populate("customer", "username name lastname")

            if (!order) {
                return res.status(404).json({ message: "Ordine non trovato" })
            }

            if (order.dealer._id.toString() !== userId && order.customer._id.toString() !== userId) {
                return res.status(403).json({ message: "Non autorizzato" })
            }

            return res.status(200).json(order)

        } catch (err) {
            return res.status(500).json({ message: "Errore interno del server", error: err.message })
        }
    },

   

    getUserOrders: async function (req, res) {
        const userId = req.user.id
        const type = req.query.type

        try {
            let orders
            if (type === 'received') {
                orders = await Order.find({ dealer: userId })
                    .populate("service", "name")
                    .populate("customer", "name lastname")
            } else {
                orders = await Order.find({ customer: userId })
                    .populate("service", "name")
                    .populate("dealer", "name lastname")
            }

            if (orders.length === 0) return res.status(404).json({ message: "Nessun ordine trovato" })
            return res.status(200).json(orders)

        } catch (err) {
            return res.status(500).json({ message: "Errore interno del server", error: err.message })
        }
    },

    updateOrder: async function (req, res) {
        const orderId = req.params._id
        const userRole = req.user.role
        const userId = req.user.id

        try {
            const order = await Order.findById(orderId)
            if (!order) return res.status(404).json({ message: "Ordine non trovato" })

            if (order.dealer.toString() !== userId && order.customer.toString() !== userId) {
                return res.status(403).json({ message: "Non autorizzato" })
            }

            if (userRole === 'dealer') {
                const { orderStatus } = req.body
                order.orderStatus = orderStatus
            } else {
                const { paymentStatus } = req.body
                order.paymentStatus = paymentStatus
            }

            await order.save()
            return res.status(200).json({ message: "Ordine aggiornato con successo", order })

        } catch (err) {
            return res.status(500).json({ message: "Errore interno del server", error: err.message })
        }
    },

    payOrder: async function (req, res) {
        const orderId = req.params._id
        const userId = req.user.id

        try {
            const order = await Order.findById(orderId)
            if (!order) return res.status(404).json({ message: "Ordine non trovato" })

            if (order.customer.toString() !== userId) {
                return res.status(403).json({ message: "Non autorizzato" })
            }

            if (order.paymentStatus === 'effettuato') {
                return res.status(400).json({ message: "Ordine già pagato" })
            }

            const customer = await User.findById(order.customer)
            const dealer = await User.findById(order.dealer)

            if (!customer || !dealer) {
                return res.status(404).json({ message: "Utente non trovato" })
            }

            if (customer.balance < order.finalCost) {
                return res.status(400).json({ message: "Saldo insufficiente" })
            }

            customer.balance -= order.finalCost
            dealer.balance += order.finalCost
            order.paymentStatus = 'effettuato'

            await customer.save()
            await dealer.save()
            await order.save()

            return res.status(200).json({
                message: "Pagamento effettuato con successo",
                order,
                newBalance: customer.balance
            })

        } catch (err) {
            return res.status(500).json({ message: "Errore interno del server", error: err.message })
        }
    }
}

const Order = require('../schema/orderSchema')
const Service = require('../schema/serviceSchema')
const User = require('../schema/userSchema')
const path = require('path')
const PDFDocument = require('pdfkit')

/*
    Qui ci sono tutte le API CRUD riguardante gli ordini
 */


module.exports = {
    createOrder: async function (req, res) {
        const { serviceId } = req.body
        const customerId = req.user.id

        try {
            const service = await Service.findById(serviceId)
            if (!service) return res.status(404).json({ message: "Servizio non trovato" })
            if (customerId === service.dealer.toString()) {
                return res.status(403).json({ message: "Non sei autorizzato" })
            }

            const newOrder = new Order({
                dealer: service.dealer,
                customer: customerId,
                service: serviceId,
                finalCost: service.cost,
                serviceName: service.name
            })

            await newOrder.save()
            const customer = await User.findById(customerId)
            customer.orders.push(newOrder._id)
            await customer.save()
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
                    .populate("service", "name cost")
                    .populate("dealer", "name lastname")
            }

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

            if(userRole === "dealer" && order.dealer.toString() !== userId) {
                return res.status(403).json({ message: "Non sei autorizzato" })
            }

            if (userRole === 'dealer') {
                const { orderStatus } = req.body

                if (orderStatus === "completato") {
                    if(order.orderStatus === "completato") {
                        return res.status(400).json({message: "Ordine già completato" })
                    }
                    if(order.paymentStatus === "effettuato") {
                        const dealer = await User.findById(order.dealer)
                        if (!dealer)
                            return res.status(404).json({ message: "Dealer non trovato" })

                        dealer.balance += order.finalCost
                        await dealer.save()
                    }
                }

                if (orderStatus === "annullato" && order.paymentStatus === "effettuato") {
                    const customer = await User.findById(order.customer)
                    if (!customer)
                        return res.status(404).json({ message: "Cliente non trovato" })

                    customer.balance += order.finalCost
                    order.paymentStatus = "rimborsato"
                    await customer.save()
                }

                order.orderStatus = orderStatus

            } else {
                return res.status(403).json({ message: "Non autorizzato" })

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

            if (order.orderStatus === 'annullato') {
                return res.status(400).json({ message: "Ordine annullato: pagamento non consentito" })
            }

            if (order.paymentStatus === 'effettuato') {
                return res.status(400).json({ message: "Ordine già pagato" })
            }

            const customer = await User.findById(order.customer)
            if (!customer) {
                return res.status(404).json({ message: "Utente non trovato" })
            }

            if (customer.balance < order.finalCost) {
                return res.status(400).json({ message: "Saldo insufficiente" })
            }

            customer.balance -= order.finalCost
            order.paymentStatus = 'effettuato'

            await customer.save()
            await order.save()

            return res.status(200).json({
                message: "Pagamento effettuato con successo",
                order,
                newBalance: customer.balance
            })

        } catch (err) {
            return res.status(500).json({ message: "Errore interno del server", error: err.message })
        }
    },

    /*
        Date le richeste del profetto, questa è una api BE esterna inclusa nella libreria
        esterna pdfkit
     */

    downloadPdf: async function (req, res) {
        const orderId = req.params._id
        const userId = req.user.id

        try {
            const order = await Order.findById(orderId)
                .populate("service", "name cost")
                .populate("dealer", "name lastname username city address")
                .populate("customer", "name lastname username")

            if (!order) return res.status(404).json({ message: "Ordine non trovato" })

            if (order.customer._id.toString() !== userId) {
                return res.status(403).json({ message: "Non autorizzato" })
            }

            if (order.paymentStatus !== 'effettuato') {
                return res.status(403).json({ message: "Ricevuta disponibile solo dopo il pagamento" })
            }


            const doc = new PDFDocument({ margin: 50 })

            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', `attachment; filename="ricevuta-${order._id}.pdf"`)

            // Collego lo stream del PDF alla risposta HTTP
            doc.pipe(res)


            const logoPath = path.join(__dirname, '../assets/logo.png')
            doc.image(logoPath, doc.page.width - 110, 30, { width: 60 })

            doc.fontSize(22).font('Helvetica-Bold').text('DoneDeal', { align: 'center' })
            doc.fontSize(11).font('Helvetica').fillColor('gray').text('Ricevuta di pagamento', { align: 'center' })
            doc.moveDown(2)

            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
            doc.moveDown()

            doc.fontSize(12).fillColor('black')
            doc.font('Helvetica-Bold').text('Dettagli ordine')
            doc.font('Helvetica').moveDown(0.5)

            doc.text(`ID ordine:        ${order._id}`)
            doc.text(`Data:             ${new Date(order.orderDate).toLocaleDateString('it-IT')}`)
            doc.moveDown()

            doc.font('Helvetica-Bold').text('Servizio')
            doc.font('Helvetica').moveDown(0.5)
            doc.text(`Nome:             ${order.serviceName || order.service?.name || '—'}`)
            doc.text(`Importo pagato:   € ${order.finalCost.toFixed(2)}`)
            doc.moveDown()

            doc.font('Helvetica-Bold').text('Fornitore')
            doc.font('Helvetica').moveDown(0.5)
            doc.text(`Nome:             ${order.dealer?.name} ${order.dealer?.lastname}`)
            doc.text(`Username:         ${order.dealer?.username}`)
            doc.text(`Città:            ${order.dealer?.city || '—'}`)
            doc.text(`Indirizzo:        ${order.dealer?.address || '—'}`)
            doc.moveDown()

            doc.font('Helvetica-Bold').text('Cliente')
            doc.font('Helvetica').moveDown(0.5)
            doc.text(`Nome:             ${order.customer?.name} ${order.customer?.lastname}`)
            doc.text(`Username:         ${order.customer?.username}`)
            doc.moveDown(2)

            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
            doc.moveDown()
            doc.fontSize(10).fillColor('gray').text('DoneDeal — Documento generato automaticamente', { align: 'center' })

            doc.end()

        } catch (err) {
            return res.status(500).json({ message: "Errore interno del server", error: err.message })
        }
    }
}
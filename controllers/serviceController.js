const express = require("express")
const Service = require("../schema/serviceSchema")

module.exports = {
    createService: (req, res) => {
        const data= req.body
        const newService = new Service({
            name: data.name,
            description: data.description,
            cost: data.cost,
            dealer: data.dealer
        })
    }
}
const express = require('express'); 
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/order');
const checkAuth = require('../middleware/check-auth');
const OrderController = require('../controllers/orders');

router.get('/', checkAuth, OrderController.get_all_orders );

router.post('/', checkAuth, (req, res, next) => {
    const Product = require('../models/product');
    Product.findById(req.body.product)
    .then(product => {
        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }
    }).catch(err => {
        res.status(500).json({error: err});
    });

    const order = new Order({
        _id: new mongoose.Types.ObjectId(),
        product: req.body.product,
        quantity: req.body.quantity
    })
    order.save()
    .then(result => {
        console.log(result);
        res.status(201).json({
            message: 'Order stored',
            createdOrder: {
                _id: result._id,
                product: result.product,
                quantity: result.quantity
            },
            request: {
                type: 'GET',
                url: 'http://localhost:3000/orders/' + result._id
            }
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
})

router.get('/:orderId', checkAuth,  (req, res, next) => {
    const id = req.params.orderId;
    Order.findById(id)
    .select('product quantity _id')
    .populate('product')
    .exec()
    .then(doc => {
        console.log(doc);
        if (doc) {
            res.status(200).json({
                order: doc,
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/orders'
                }
            });
        } else {
            res.status(404).json({message: 'No valid entry found for provided ID'});
        }
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
});

router.patch('/:orderId', checkAuth,  (req, res, next) => {
    const id = req.params.orderId;
    const updateOps = {};
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Order.updateOne({_id: id}, {$set: updateOps})
    .exec()
    .then(result => {
        console.log(result);
        res.status(200).json({
            message: 'Order updated',
            request: {
                type: 'GET',
                url: 'http://localhost:3000/orders/' + id
            }
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
});

router.delete('/:orderId', checkAuth, (req, res, next) => {
    const id = req.params.orderId;
    Order.deleteOne({_id: id})
    .exec()
    .then(result => {
        res.status(200).json({
            message: 'Order deleted',
            request: {
                type: 'POST',
                url: 'http://localhost:3000/orders',
                body: {product: 'ID', quantity: 'Number'}
            }
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
})

module.exports = router; // Export the router object
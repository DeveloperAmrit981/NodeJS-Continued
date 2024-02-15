const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const checkAuth = require('../middleware/check-auth');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    //reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    }else{
        cb(null, false);
    }
}

const upload = multer({
    storage: storage, 
    limits: {
    fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

const Product = require('../models/product');

// Handle incoming GET requests to /products
router.get('/', (req, res, next) => {
   Product.find()
   .select('name price _id productImage')
   .exec()
    .then(docs => {
        const response = {
            count: docs.length,
            products: docs.map(doc => {
                return {
                    name: doc.name,
                    price:doc.price,
                    _id: doc._id,
                    productImage: doc.productImage,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/products/' + doc._id
                    }
                }
            })
        };
        
         console.log(docs);
         res.status(200).json(response);
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
})

// Handle incoming POST requests to /products
router.post('/',checkAuth, upload.single('productImage') ,(req, res, next) => {
    console.log(req.file);
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        productImage: req.file.path
    })
    product.save().then(result => 
        console.log(result)
    )

    res.status(201).json({
        message: 'Created product successfully',
        createdProduct: product
    });
});

// Handle incoming GET requests to /products/:productId
router.get('/:productId', (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id)
    .select('name price _id')
    .exec()
    .then(doc => {
        console.log(doc);
        if (doc) {
            res.status(200).json({
                product: doc,
                request: {
                    type: 'GET',
                    description: 'Get all products',
                    url: 'http://localhost:3000/products'
                }
            });
        } else {
            res.status(404).json({message: 'No valid entry found for provided ID'});
        }
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
})

// Handle incoming PATCH requests to /products/:productId
router.patch('/:productId', checkAuth, (req, res, next) => {
       const id = req.params.productId;
       const updateOps = {};
       for (const ops of req.body) {
           updateOps[ops.propName] = ops.value;
       }
       Product.updateOne({_id: id}, {$set: updateOps})
       .exec()
         .then(result => {
              console.log(result);
              res.status(200).json({
                    message: 'Product updated',
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/products/' + id
                    }
                
              });
         }).catch(err => {
              console.log(err);
              res.status(500).json({error: err});
         });
})

// Handle incoming DELETE requests to /products/:productId
router.delete('/:productId', checkAuth, (req, res, next) => {
    const id = req.params.productId;
    Product.deleteOne({_id: id})
    .exec()
    .then(result => {
        res.status(200).json({
            message: 'Product deleted',
            request: {
                type: 'POST',
                url: 'http://localhost:3000/products',
                body: {name: 'String', price: 'Number'}
            }
        
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
})

module.exports = router; // Export the router object
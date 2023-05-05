// import dependicies

var express = require('express');
const req = require('express/lib/request');
var path = require('path');
var myApp = express();
var bodyParser = require('body-parser');


//Setup MongoDB connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/OnlineStore', {
    UseNewUrlParser: true,
    UseUnifiedTopology: true
}).then(() => {
    console.log('Connection Successful...');
}).catch((error) => {
    console.log('Something Wrong', error);
});

//Setup DB Model
const inventory = mongoose.model('inventories', {
    name: String,
    address: String,
    city: String,
    province: String,
    phone: String,
    email: String,
    prod1: Number,
    prod2: Number,
    prod3: Number,
    subtotal: Number,
    tax: Number,
    total: Number,
    prod1n: Number,
    prod2n: Number,
    prod3n: Number
});


const {
    check,
    validationResult
} = require('express-validator');
myApp.use(express.urlencoded({
    extended: true
}));

// Set path to public and views folder.
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');


//-----------------Validation Functions-------------------

//phone regex
var phoneRegex = /^[0-9]{3}\-?[0-9]{3}\-?[0-9]{4}$/; //123-123-1234

function checkRegex(userInput, regex) {
    if (regex.test(userInput))
        return true;
    else
        return false;
}

function customPhoneValidation(value, {
    req
}) {
    var phone = req.body.phone;
    if (!phone) {
        throw new Error('Phone number is required\n');
    } else if (!checkRegex(value, phoneRegex)) {
        throw new Error('Please enter correct number...')
    }
    return true;
}

//Form (Home/Root) Page
myApp.get('/', function (req, res) {
    res.render('form')
    res.end();
});
myApp.post('/', [
    check('name', 'Name is required!').notEmpty(),
    check('address', 'Address is required').notEmpty(),
    check('city', 'City is required').notEmpty(),
    check('province', 'Province is required').notEmpty(),
    check('phone', '').custom(customPhoneValidation),
    check('email', 'Email is required').notEmpty(),
    check('email', 'Please enter a valid email address').isEmail(),
], function (req, res) {

    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty()) {
        res.render('form', {
            errors: errors.array()
        });
    } else {
        //capture the input fields
        var name = req.body.name;
        var address = req.body.address;
        var city = req.body.city;
        var province = req.body.province;
        var phone = req.body.phone;
        var email = req.body.email;
        var prod1n = req.body.prod1;
        var prod2n = req.body.prod2;
        var prod3n = req.body.prod3;

        var p1Total = parseInt(prod1n * 10);
        var p2Total = parseInt(prod2n * 20);
        var p3Total = parseInt(prod3n * 40);

        var subtotal = p1Total + p2Total + p3Total;
        var tax = "";
        if (province == "on") {
            tax = subtotal * 0.13;
        } else if (province == "bc") {
            tax = subtotal * 0.07;
        } else if (province == "qbc") {
            tax = subtotal * 0.09975;
        }

        var total = subtotal + tax;

        var pageData = {
            name: name,
            address: address,
            city: city,
            province: province,
            phone: phone,
            email: email,
            prod1: p1Total,
            prod2: p2Total,
            prod3: p3Total,
            subtotal: subtotal,
            tax: tax,
            total: total,
            prod1n,
            prod2n,
            prod3n
        }
    };

    //create object for model-inventory
    var myInventory = new inventory(pageData);

    //save inventory to MondoDB
    myInventory.save().then(function () {
        console.log('New Inventory Saved.');
    });

    //display the receipt output on receipt
    console.log(req.body);
    res.render('receipt', pageData); // redirect to receipt page
    res.end();
});
//allorder page
myApp.get('/allorders', function (req, res) {
    inventory.find({}).exec(function (err, inventories) {
        console.log(err);
        console.log(inventories);
        res.render('allorders', {
            inventories: inventories
        });
    });
})
myApp.listen(8082);
console.log('Everything executed fine... Open http://localhost:8082/');
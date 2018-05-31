// PART #3 -------Once the customer has placed the order, your application should check if your store has enough of the product to meet the customer's request.
    // If not, the app should log a phrase like Insufficient quantity!, and then prevent the order from going through.
    // However, if your store does have enough of the product, you should fulfill the customer's order.
        // This means updating the SQL database to reflect the remaining quantity.
        // Once the update goes through, show the customer the total cost of their purchase.

var inquirer = require("inquirer");
var mysql = require("mysql");

var connection = mysql.createConnection({
    host: "localhost",
    port: 8889,
    user: "root",
    password: "root",
    database: "bamazon"
})

connection.connect(function(err){
    console.log("You're connected using ID# " + connection.threadId + "\n");
    if (err) throw err;
    readData();
});

function readData(){
    console.log("Welcome to Walker's Sock Emporium! Take a look at our wares:\n\n");
    var queryRead = "SELECT item_id,product_name,price FROM products";
    connection.query(queryRead, function(err, res){
        var choicesArr = [];
        for(var i = 0; i < res.length; i++){
            console.log(res[i].product_name + "   $" + res[i].price + "   ID# " + res[i].item_id + "\n---------------------------------------------------");
            choicesArr.push("ID# " + res[i].item_id + "   " + res[i].product_name);
        };
        console.log("\n");
        buySomething(choicesArr);
    });
}

function buySomething(list){
    inquirer.prompt([
        {
            type: "list",
            name: "itemID",
            message: "Choose the product you wish to buy:",
            choices: list
        }
    ]).then(function(choice){
        var getID = choice.itemID.split(" ");
        howMuch(getID[1]);
    });
}

function howMuch(itemChoice){
    var itemID = itemChoice;
    var quantityDesired;

    inquirer.prompt([
        {
            type: "input",
            name: "quantity",
            message: "How many would you like to buy?"
        }
    ]).then(function(purchase){
        quantityDesired = purchase.quantity;
        checkOrder(itemID, quantityDesired);
    });
}

function checkOrder(itemID, quantityDesired){
    var quantityInStock;

    var queryCheck = "SELECT item_id,product_name,stock_quantity FROM products WHERE item_id = ?";
    connection.query(queryCheck, itemID, function(err,res){
        quantityInStock = res[0].stock_quantity;

        if(res[0].stock_quantity > quantityDesired){
            console.log("You have requested " + quantityDesired + " pairs of " + res[0].product_name);
            fulfillOrder(itemID, quantityDesired, quantityInStock);
        }else if(res[0].stock_quantity < quantityDesired){
            console.log("Not enough inventory! Order canceled.");
            another();
        }
    });
}

function fulfillOrder(itemID, quantityDesired, quantityInStock){
    var queryUpdate = "UPDATE products SET ? WHERE ?";
    var update = [
        {
            stock_quantity: quantityInStock - quantityDesired
        },
        {
            item_id: itemID
        }];

    connection.query(queryUpdate, update, function(err, res){
        totalCost(itemID, quantityDesired);
    });
}

function totalCost(itemID, quantityDesired){
    var queryPrice = "SELECT price,item_id FROM products WHERE item_id = ?";
    connection.query(queryPrice, itemID, function(err, res){
        var totalCost = quantityDesired * res[0].price;
        console.log("That brings your order total to $" + totalCost);
        another();
    });
}

function another(){
    inquirer.prompt([
        {
            type:"confirm",
            name: "another",
            message: "Would you like to try another order?",
            default: true
        }
    ]).then(function(again){
        if(again.another){
            readData();
        }else{
            console.log("Have a wonderful day! We hope to see you in the future!");
            connection.end();
        }
    });
}
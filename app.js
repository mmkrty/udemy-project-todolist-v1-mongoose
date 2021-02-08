const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
//require mongoose
const mongoose = require("mongoose");


const app = express();

//set home page to the ejs file in views folder
app.set("view engine", "ejs");

//enabling parsing the body of post 
app.use(bodyParser.urlencoded({extended:true}));

//serve the public folder to the server
app.use(express.static("public"));


//connect to database
mongoose.connect("mongodb+srv://admin-hao:big5091026@cluster0.wujog.mongodb.net/todolistDB",{useNewUrlParser: true, useUnifiedTopology: true})

//create new schema for items
const itemsSchema = new mongoose.Schema({
    name: String
});

//create new model for items
const Item = mongoose.model("Item", itemsSchema);

//create default items
const item1 = new Item ({
    name: "Welcome to your todolist."
});
const item2 = new Item ({
    name: "Hit the + button to add a new item."
});
const item3 = new Item ({
    name: "<-- Hit this to delete an item."
});

//save default items to a array
const defaultItems =[item1, item2, item3];

//new Schema for custom list
const listSchema  = {
    name: String,
    items: [itemsSchema]
};

//new model for custom list
const List = mongoose.model("List", listSchema);






//home route
app.get("/", function(req,res){
    
    //get all the items in the collection 
    Item.find({}, function(err,items){

        if(items.length === 0) {
            //save default items to db
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err)
                } else {
                    console.log("sucessful")
                }
            });
            res.redirect("/")
        } else {
             //rendering data to list.ejs
            res.render("list", {listTitle: "Today", newListItems: items});
        }

      
    });

});

//custom route
app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({name:customListName}, function(err, foundList){
        if (!err){
            if(!foundList){
             const list = new List({
                name: customListName,
                items: defaultItems
            });

            list.save();

            res.redirect("/"+customListName);

            } else{

               res.render("list",  {listTitle: foundList.name, newListItems: foundList.items})
            }
        }
    })
    


})


app.post("/", function(req,res){
    
    //save new item to db
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item ({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        });
    }

    
    
});


app.post("/delete", function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName =  req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
        if(!err){
            console.log("delete successful");
            res.redirect("/");
            }
         });
    } else { 
        List.findOneAndUpdate( 
            {name: listName},
            {$pull: {items:{_id: checkedItemId}}},
            function(err, foundList) {
                if(!err){
                    res.redirect("/"+listName);
                }
            });

    }

    
});


// app.get("/work", function(req,res){
//     res.render("list",  {listTitle: "Work", newListItems: workItems})
// });


app.get("/about", function(req,res){
    res.render("about")
})



app.listen(3000, function(){
    console.log("The Server is running on port 3000.");
});
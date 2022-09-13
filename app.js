const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://nipunjain:nipun123@cluster0.cxtzgyx.mongodb.net/todolistDB");

// now creating schema for adding items
const itemsSchema = {
    name : String
}

//now creating new mongoose model based on this schema
const Item = mongoose.model("Item", itemsSchema);

// Creating some default items
const item1 = new Item({
    name : "Welcome to your todolist"
});

const item2 = new Item({
    name : "Hit the + button to add new item"
});

const item3 = new Item({
    name : "<-- Hit this to delete the item"
});
const defaultItems = [item1, item2, item3];

app.get("/", function(req, res){  
    Item.find({}, function(err, result){
        if(result.length===0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("Successfully saved default items to the DB")
                }
            });
            res.redirect('/');
        }else{
            res.render("list", {listTitle: "Today", newlistItem:result});
        }        
    });
});

app.set('view engine', 'ejs');

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name : itemName,
    })

    if(listName==="Today"){
        item.save();
        res.redirect('/');
    }else{
        List.findOne({name : listName}, function(err, foundlist){
            foundlist.items.push(item);
            foundlist.save();
            res.redirect("/" + listName);
        })
    }

})

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(err){
                conosle.log(err);
            }else{
                console.log("Successfully deleted the checked item");
                res.redirect('/');
            }
        })
    }else{
        List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemId}}}, function(err, foundlist){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }
    
});


const listSchema = {
    name: String,
    items : [itemsSchema] 
}

const List = mongoose.model("List", listSchema);

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({name : customListName}, function(err, foundlist){
        if(!err){
            if(!foundlist){
                // create a new list
                const list = new List({
                    name : customListName,
                    items : defaultItems
                });
            
                list.save();
                res.redirect("/" + customListName);
            }else{
                // show an existing list
                res.render("list", {listTitle: foundlist.name, newlistItem:foundlist.items})
            }
        }else{
            console.log(err);
        }
    })
});

app.get("/about", function(req, res){
    res.render("about");
})
app.listen(process.env.PORT || 3000, function(){
    console.log("server started Successfully");
})
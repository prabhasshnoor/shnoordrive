
const express=require('express');
const app=express();
const path=require('path');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.get("/",function(req,res){
    res.render("index");
});
app.get("/profile/:username",function(req,res){
    
    res.send(`Welcome ${req.params.username}`);
});
app.get("/profile/:username/:age", function (req, res) {
  res.send(`Welcome ${req.params.username}, age ${req.params.age}`);
});

app.listen(3000,()=>{
   console.log("It's running on port 3000"); 
})
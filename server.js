'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dotenv = require('dotenv').config();
var cors = require('cors');
var bodyParser = require('body-parser');
var dns = require('dns');
var shortid = require('shortid');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
var Schema = mongoose.Schema;

var urlSchema = new Schema({
  original_URL: String,
  short_URL: String
});

const URL = mongoose.model('url', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.json());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

const preProcessUrl = (url) => {
  console.log(url); 
  let lookup_url = url.match(/^https?:\/\/www\.(\w*\.\w+.*)/);
  console.log(lookup_url);
  return lookup_url;

}
app.post("/api/shorturl/new", async function(req, res){

  let preUrl = preProcessUrl(req.body.url);
  if( !preUrl){
    res.json({error: "invalid url"});
    return;
  }
  dns.lookup(preUrl[1], (err, address, family) => {
    if (err){
      console.log(err);
      res.json(err);
      return;
    }
  });

  let foundUrl = await URL.findOne({original_URL: req.body.url});
  if(foundUrl){
    res.json({original_url : foundUrl.original_URL, short_URL: foundUrl.short_URL});
  } else {
    let shortUrl = shortid.generate();
    foundUrl = new URL({original_URL: req.body.url, short_URL: shortUrl});
    foundUrl.save();
  }

});

app.get("/api/shorturl/:short_url", async (req, res) => {
  console.log(req.params.short_url);
  console.log("this should have a value");
  let foundUrl = await URL.findOne({short_URL: req.params.short_url}); 
  if(foundUrl){
    console.log("trying to redirect");
    res.redirect(foundUrl.original_URL);
  } else {
    res.json({error: "short url has not been created"});
  }
});

app.listen(port, function () {
  console.log('Node.js listening on '+ port);
});

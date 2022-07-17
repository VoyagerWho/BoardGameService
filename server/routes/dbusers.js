const express = require("express")
const { MongoClient, ServerApiVersion, Db } = require('mongodb');
const router = express.Router();
/**
 * DB connection
 * @type {Db}
 */
var db;
const dbname = "GameDB";
const uri = process.env.mongoApiKey;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

client.connect((err, client) => 
{
    if(err) 
        return console.log(err);
    db = client.db(dbname);
    console.log('Connect OK');
});
router.get("/list", (req, res) =>
{
    db.collection('Users').find().toArray((err, results) => 
    {
        if(err) 
            return console.log(err);
        res.json(results);
        res.end();
        console.log(results);
    });
});

// dynamic routes at the end!
router.route("/:name").get((req, res) => 
{
    console.log(req.params.name);
    db.collection('Users').findOne({name: req.params.name}, (err,result) => 
    {
        if(err) 
            return console.log(err);
        res.json(result);
        res.end();
        console.log(result);
    });
}).post((req, res) =>
{
    res.end("Added new");
}).put((req, res) =>
{
    res.end("Updated");
}).delete((req, res) =>
{
    res.end("Deleted");
});

// runs every time on param
router.param("name", (req, res, next, param) =>
{
    console.log(param);
    next();
});

module.exports = router;
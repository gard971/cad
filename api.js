const app = require("express")();
const http = require("http").createServer(app)
const io = require("socket.io")(http)
const path = require("path")
const express = require("express")
const fs = require("fs")
const main = require(__dirname + "/index.js")
function request(req, res){
    if(req.query.name == undefined){
        res.send("missing arguments")
        res.end()
    }
    else{
        var json = main.jsonRead("data/users.json")
        for(var i = 0; i<json.table.length; i++){
            if(fs.existsSync("data/"+json.table[i].username+"/civillians.json")){
                var civs = main.jsonRead("data/"+json.table[i].username+"/civillians.json")
                for(var u = 0; i<civs.length; u++){
                    if(civs[u] == undefined){
                        break;
                    }
                    if(civs[u].Firstname+" "+civs[u].Surname == req.query.name){
                        res.send(JSON.stringify(civs[u]))
                        res.end()
                        return false
                    }
                }
            }
        }
        res.send("not found in databse")
        res.end()
    }
}

module.exports.request = request;
const app = require("express")();
const http = require("http").createServer(app)
const io = require("socket.io")(http)
const path = require("path")
const express = require("express")
const fs = require("fs")
const main = require(__dirname + "/index.js")
function request(req, res){
    if(req.query.password == undefined || req.query.name == undefined && req.query.plate == undefined && req.query.newCallsign){
        res.send("missing arguments")
        res.end()
    }
    else if(req.query.password != "test"){
        res.send("wrong password")
        res.end()
        return false
    }
    else if(req.query.name){
        var json = main.jsonRead("data/users.json")
        for(var i = 0; i<json.table.length; i++){
            if(fs.existsSync("data/"+json.table[i].username+"/civillians.json")){
                var civs = main.jsonRead("data/"+json.table[i].username+"/civillians.json")
                for(var u = 0; i<civs.length; u++){
                    if(civs[u] == undefined){
                        break
                    }
                    if((civs[u].Firstname+" "+civs[u].Surname).toUpperCase() == req.query.name.toUpperCase()){
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
    else if(req.query.plate){
        var json = main.jsonRead("data/users.json")
        for(var i = 0; i<json.table.length; i++){
            if(fs.existsSync(`data/${json.table[i].username}/vehicles.json`)){
                var plates = main.jsonRead(`data/${json.table[i].username}/vehicles.json`)
                for(var p = 0; p<plates.length; p++){
                    if(plates[p].plate == req.query.plate){
                        res.send(plates[p])
                        res.end()
                        return false
                    }
                }
            }
        }
        res.send("not found in database");
        res.end()
    }
    else if(req.query.newCallsign){
        if(req.query.oldCallsign){
            main.units.forEach(unit => {
                if(unit.callsign == req.query.oldCallsign){
                    unit.callsign == req.query.newCallsign
                    res.send("callsign changed")
                    res.end()
                }
            })
        }
        else{
            var newObeject = {
                "callsign":req.query.newCallsign,
                "status": "10-7"
            }
            main.units.push(newObeject)
            res.send("callsign added")
            res.end()
            return false;
        }
        res.send("somthing went wrong :(")
        res.end()
    }
}

module.exports.request = request;
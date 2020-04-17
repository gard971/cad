//VERSION A1(alpha version.)

//////CONFIG will require a server restart before beeing put into effect///////

var useLogs = false //change this variable to false to disable action logging like when admins adds/removes departments, will not affect error logging
var serverRestarted = true //Change this to false to disable page reloading on server restart. Due to login security it is recomended to keep it on
var port = 3000; //only change this if you are running multiple services on the network, and you know what you are doing

////////////////////

//////DONT CHANGE ANYTHING BELOW THIS LINE UNLESS YOU KNOW WHAT YOU ARE DOING!!////////
//Packages requierd for this app. Will not work without
const fs = require("fs")
const app = require("express")();
const http = require("http").createServer(app).listen(port, () => {console.log(`server listening on port ${port}, please use CTRL + C twice to stop server`); log("---------------");log("Server started");log("---------------")})
const io = require("socket.io")(http)
const path = require("path")
const express = require("express")

//api file. Required for the fivem ingame implementation
const api = require(__dirname + "/api.js")
//A bunch of public variables required to store different objects for the website
var approvedKeys = []
var units = []
var callAmmounts = 0;
var calls = []
app.use("/api", (req, res) => { //used when the api is called and passes the request on to the api. Check out the api code in the 'api.js' file
    api.request(req, res)
})
//serving all the client files to client browser
app.use(express.static(path.join(__dirname, "public")))
//listening for conections
io.on("connection", (socket) => {
    //refreshes all clients on server restart if 'serverRestarted' == true
    if(serverRestarted){
        io.sockets.emit("refresh")
        serverRestarted = false
    }
    //listens for login requests and checks the clients username and password
    socket.on("login", (username, password) => {
        var json = jsonRead("data/users.json")
        var found = false
        for(var i = 0; i<json.table.length; i++){
            if(json.table[i].username == username && json.table[i].password == password){
                var key = Math.random()
                var newObject = {
                    "username":username,
                    "key":key
                }
                approvedKeys.push(newObject)
                socket.emit("passwordCorrect", username, key)
                found = true
            } 
        }
        if(!found){
            socket.emit("passwordWrong")
        }
    })
    //listens for register requests and checks if user allready exists then creates a new user if not
    socket.on("register", (username, password) => {
        var json = jsonRead("data/users.json")
        var found = false
        for(var i = 0; i<json.table.length; i++){
            if(json.table[i].username == username){
                socket.emit("usernameExists")
                found = true
            }
        }
        if(!found){
            var newObject = {
                "username":username,
                "password":password,
                "deps":["civillian"]
            }
            json.table.push(newObject)
            jsonWrite(json, "data/users.json")
            socket.emit("userCreated")
        }
    })
    //checks if the client has logged in before accesing logged in pages and redirects to the login page if not
    socket.on("check", (username, key, needDeps) => {
        var json = jsonRead("data/users.json")
        var allowed = false
        for(var i = 0; i<approvedKeys.length; i++){
            if(approvedKeys[i].username == username && approvedKeys[i].key == key){
                socket.emit("allowed")
                allowed = true
            }
        }
        if(!allowed){
            socket.emit("notAllowed")
        }
        if(allowed && needDeps){
            var array = []
            for(var i = 0; i<json.table.length; i++){
                if(json.table[i].username == username){
                    for(var f = 0; f<json.table[i].deps.length; f++){
                        array.push(json.table[i].deps[f])
                    }
                }
            }
            socket.emit("deps", array)
        }
    })
    //creates new callsign for police and emits it to dispatch
    socket.on("callsign", (old, callsign, status) => {
        var changed = false
        if(callsign.includes("<script>")){
            socket.emit("illegalScript")
            return false;
        }
         for(var i = 0; i<units.length; i++){
             if(units[i].callsign == old){
                units[i].callsign = callsign
                units[i].status = status
                changed = true
                io.sockets.emit("unitLoggedIn", units)
             }
         }
         if(!changed){
             var newObject = {
                 "callsign":callsign,
                 "status": status
             }
             units.push(newObject)
             io.sockets.emit("unitLoggedIn", units)
         }
    })
    //removes callsign when an officer logs out
    socket.on("removeCallsign", (callsign) => {
        for(var i = 0; i<units.length; i++){
            if(units[i].callsign == callsign){
                units.splice(i, 1)
                io.sockets.emit("unitLoggedIn", units)
            }
        }
    })
    //removes approval key when somone logs out. Will only happen if the client acually presses the log out button
    socket.on("logOut", (username) => {
        for(var i = 0; i<approvedKeys.length; i++){
            if(approvedKeys[i].username == username){
                approvedKeys.splice(i)
            }
        }
    })
    //listens for dispatch loging in and gives them all current units when a new dispatch logs in or when they refreshes their page
    socket.on("requestUnits", () => {
       io.sockets.emit("unitLoggedIn", units)
    })
    socket.on("statusUpdate", (status, callsign) => {
        if(status.includes("<script>" || callsign.includes("<script>"))){
            socket.emit("illegalScript")
            return false;
        }
        for(var i = 0; i<units.length; i++){
            if(units[i].callsign == callsign){
                units[i].status = status
            }
        }
        io.sockets.emit("unitLoggedIn", units)
    })
    //used to check for the ammount of current calls to create unice id for call. Important for tracking of calls and later deleting
    socket.on("ammountCalls", () => {
        socket.emit("calls", callAmmounts)
        callAmmounts++
    })
    //used to alert all dispatch logged in of new calls so they can be added to all screens so everyone stays synced without having to refresh the page
    socket.on("callCreated", (id, code10, description, mainUnit) => {
        if(code10.includes("<script>") || description.includes("<script>") || mainUnit.includes("<script>")){
            socket.emit("illegalScript")
            return false;
        }
        var newObject = {
            "callID":id,
            "Code10":code10,
            "description":description,
            "mainUnit": [`<li>${mainUnit}</li>`, ],
            "status":"none"
        }
        calls.push(newObject)
        io.sockets.emit("newCall", newObject)
    })
    //used to delete call with their unique id and transmit to everyone that the call has been deleted to stay synced
    socket.on("deleteCall", (call) => {
        for(var i = 0; i<calls.length; i++){
            if(calls[i].callID == call){
                calls.splice(i, 1)
            }
        }
        io.sockets.emit("callDeleted", call)
    })
    socket.on("requestCalls", () => {
        socket.emit("currentCalls", calls)
    })
    socket.on("callStatus", (id, status) => {
        for(var i = 0; i<calls.length; i++){
            if(calls[i].callID == id){
                calls[i].status = status
            }
        }
        io.sockets.emit("callStatusChanged", id, calls, status)
    })
    //used to log out a unit remotly from dispatch
    socket.on("logoutUnit", (unit) => {
        io.sockets.emit("logUnitOut", (unit))
        for(var i = 0; i<units.length; i++){
            if(units[i].callsign == unit){
                units.splice(i, 1)
                io.sockets.emit("unitLoggedIn", units)
            }
        }

    })
    //used to create a new civillian character. Also checks if the civillian allready exists
    socket.on("newCharacter", (username, character) => {
        var users = jsonRead("data/users.json")
        var exists = false
        if(username.includes("<script>")){
            socket.emit("illegalScript")
            return false;
        }
        for(var u = 0; u<users.table.length; u++){
            if(fs.existsSync("data/"+users.table[u].username+"/civillians.json")){
                var civs = jsonRead("data/"+users.table[u].username+"/civillians.json")
                for(var f = 0; f<civs.length; f++){
                    if(civs[f].Firstname.toUpperCase() == character.Firstname.toUpperCase() && civs[f].Surname.toUpperCase() == character.Surname.toUpperCase()){
                        exists = true
                    }
                }
            }
        }
        if(fs.existsSync("data/"+username+"/civillians.json") && !exists){
            var json = jsonRead("data/"+username+"/civillians.json")
                json.push(character)
                jsonWrite(json, "data/"+username+"/civillians.json")
                socket.emit("characterCreated")
        }
        else if(!exists){
            var data = [character]
            fs.mkdirSync("data/"+username)
            jsonWrite(data, "data/"+username+"/civillians.json")
            socket.emit("characterCreated")
        }
        else{
            socket.emit("characterExists")
        }
    })
    socket.on("requestCivs", (username) =>{ //Used when civillains need to choose what civillian to use. Checks the all the civillians of the emitted username 
        //and then send it off to the person who requested it
        var found
        if(!fs.existsSync("data/"+username+"/civillians.json")){
            socket.emit("civs", false)
            found = false
        }
        else{
            var data = []
            var json = jsonRead("data/"+username+"/civillians.json")
            socket.emit("civs", json)
        }
    })
    //Used when police searches names on their MDT
    socket.on("databaseSearch", (firstname, lastname) => {
        if(firstname.includes("<script>") || lastname.includes("<script>")){
            socket.emit("illegalScript")
            return false;
        }
        var json = jsonRead("data/users.json")
        var found = false
        for(var i = 0; i<json.table.length; i++){
            if(fs.existsSync("data/"+json.table[i].username+"/civillians.json")){
                var civs = jsonRead("data/"+json.table[i].username+"/civillians.json")
                for(var u = 0; u<civs.length; u++){
                    if(civs[u].Firstname.toUpperCase() == firstname.toUpperCase() && civs[u].Surname.toUpperCase() == lastname.toUpperCase()){
                        socket.emit("civInfo", civs[u])
                        found = true
                    }
                }
            }
        }
        if(!found){
            socket.emit("civInfo", false)
        }
    })
    //used when police searches plates on their MDT
    socket.on("plateSearch", (plate) => {
        if(plate.includes("<script>")){
            socket.emit("illegalScript")
            return false;
        }
        var json = jsonRead("data/users.json")
        var found = false
        for(var i = 0; i<json.table.length; i++){
            if(fs.existsSync("data/"+json.table[i].username+"/vehicles.json")){
                var vehicles = jsonRead("data/"+json.table[i].username+"/vehicles.json")
                for(var v = 0; v<vehicles.length; v++){
                    if(vehicles[v].plate.toUpperCase() == plate.toUpperCase()){
                        socket.emit("plateReturn", vehicles[v])
                        found = true
                    }
                }
            }
        }
        if(!found){
            socket.emit("plateReturn", false)
        }
    })
    //used when civs creates new plates. Also checks for old plates
    socket.on("newVehicle", (array) => {
        if(array.includes("<script>")){
            socket.emit("illegalScript")
            return false;
        }
        var json  = jsonRead("data/users.json")
        var found = false
        for(var i = 0; i<json.table.length; i++ ){
            if(fs.existsSync("data/"+json.table[i].username+"/vehicles.json")){
                var vehicles = jsonRead("data/"+json.table[i].username+"/vehicles.json")
                for(var v = 0; v<vehicles.length; v++){
                    if(vehicles[v].plate.toUpperCase() == array[2].toUpperCase()){
                        socket.emit("vehicleExists")
                        found = true
                    }
                }
            }
        }
        if(!found){
            if(fs.existsSync("data/"+array[1]+"/vehicles.json") && !found){
                var vehicles = jsonRead("data/"+array[1]+"/vehicles.json")
                var newObject = {
                    "plate":array[2],
                    "color":array[3],
                    "type":array[4],
                    "doors":array[5],
                    "insurance Status":array[6],
                    "registerdOwner":array[0]
                }
                vehicles.push(newObject)
                jsonWrite(vehicles, "data/"+array[1]+"/vehicles.json")
                socket.emit("vehicleCreated")

            }
            else if(fs.existsSync("data/"+array[1])){
                var vehicles = [{
                    "plate":array[2],
                    "color":array[3],
                    "type":array[4],
                    "doors":array[5],
                    "registerdOwner":array[0]
                }]
                jsonWrite(vehicles, "data/"+array[1]+"/vehicles.json")
                socket.emit("vehicleCreated")

            }
            else{
                fs.mkdirSync("data/"+array[1])
                var vehicles = [{
                    "plate":array[2],
                    "color":array[3],
                    "type":array[4],
                    "doors":array[5],
                    "registerdOwner":array[0]
                }]
                jsonWrite(vehicles, "data/"+array[1]+"/vehicles.json")
            }
        }
    })
    socket.on("grabLicense", (civName, username) => { //used when civs enter the MDT page to find their license status
        if(civName.includes("<script>") || username.includes("<script>")){
            socket.emit("illegalScript")
            return false;
        }
        if(fs.existsSync("data/"+username+"/civillians.json")){
            var json = jsonRead("data/"+username+"/civillians.json")
            for(var i = 0; i<json.length; i++){
                if(json[i].Firstname+" "+json[i].Surname == civName){
                    socket.emit("licenseFound", json[i].license)
                    return false;
                   
                }
            }
            socket.emit("eror", "500, internal server error. license not found")
        }
    })
    socket.on("changeLicense", (username, civName, value) => { //used when civillians change their license status
        if(fs.existsSync("data/"+username+"/civillians.json")){
            var json = jsonRead("data/"+username+"/civillians.json")
            for(var i = 0; i<json.length; i++){
                if(json[i].Firstname+" "+json[i].Surname == civName){
                    json[i].license = value
                    jsonWrite(json, "data/"+username+"/civillians.json")
                    return false;
                }
            }
        }
        socket.emit("eror", "500 internal server error, could not find suplied civilianName in suplied Username. Changes not saved")
    })
    socket.on("policeChangeLicense", (name, status) => { //used when police changes a civs license status
        var json = jsonRead("data/users.json")
        for(var i = 0; i<json.table.length; i++){
            if(fs.existsSync("data/"+json.table[i].username+"/civillians.json")){
                var civs = jsonRead("data/"+json.table[i].username+"/civillians.json")
                for(var u = 0; i<civs.length; u++){
                    if(civs[u].Firstname+" "+civs[u].Surname == name){
                        civs[u].license = status
                        jsonWrite(civs, "data/"+json.table[i].username+"/civillians.json")
                        return false;
                    }
                }
            }
        }
        socket.emit("eror", "500 internal server error. No changes saved. ERR: PCHANGELICENSE_NAME_NOT_FOUND")
    })
    socket.on("newAdmin", (user, adminUsername) => { //used to add new admins. This function might be deprecated in future realeses beacuse it can be added through the addDepartment
        //function
        var json = jsonRead("data/users.json")
        for(var i = 0; i<json.table.length; i++){
            if(json.table[i].username == user){
                json.table[i].deps.push("admin")
                jsonWrite(json, "data/users.json")
                log(`user ${adminUsername} just added ${user} as admin`)
                return false;
            }
        }
        socket.emit("eror", "500 internal server error. Could not find suplied user")
    })
    socket.on("removeAdmin", (admin, removerUsername) => { //same as the above just to remove admins. Migth also get deprecated to use the removeDepartment instead
        var json = jsonRead("data/users.json")
        for(var i = 0; i<json.table.length; i++){
            if(json.table[i].username == admin){
                var index = json.table[i].deps.indexOf("admin")
                if(index != -1){
                    json.table[i].deps.splice(index, 1)
                    jsonWrite(json, "data/users.json")
                    log(`user ${removerUsername} just removed admin role from ${admin}`)
                    return false;
                }
            }
        }
        socket.emit("eror", "500, internal server error. Changes not saved. Contact siteAdmin if you require imidiate support or try again")
    })
    socket.on("newWarrant", (name, title, description) => { //used to create new warrants for a civillian
        var json = jsonRead("data/users.json")
        for(var i = 0; i<json.table.length; i++){
            if(fs.existsSync("data/"+json.table[i].username+"/civillians.json")){
                var civs = jsonRead("data/"+json.table[i].username+"/civillians.json")
                for(var u = 0; u<civs.length; u++){
                    if(name[0] == civs[i].Firstname && name[1] == civs[i].Surname){
                        var warrant = {
                            "title":title,
                            "description":description
                        }
                        civs[i].warrants.push(warrant)
                        jsonWrite(civs, "data/"+json.table[i].username+"/civillians.json")
                        return false;
                    }
                }
            
            }
        }
        socket.emit("eror", "500 internal server error changes not saved. could not find suplied civillian")
    })
    socket.on("removeWarrant", (index, user) => { //used to remove a warrant from user
        var json = jsonRead("data/users.json")
            for(var i = 0; i<json.table.length; i++){
                if(fs.existsSync("data/"+json.table[i].username+"/civillians.json")){
                    var civs = jsonRead("data/"+json.table[i].username+"/civillians.json")
                    for(var u = 0; u<civs.length; u++){
                        if(civs[u].Firstname == user[0] && civs[u].Surname == user[1]){
                            if(index == "all"){
                                civs[u].warrants.splice(0)
                                jsonWrite(civs,"data/"+json.table[i].username+"/civillians.json" )
                                socket.emit("warrantsUpdated")
                                return false;
                            }
                            else{
                                civs[u].warrants.splice(index, 1)
                                socket.emit("warrantsUpdated")
                            }
                        }
                    }
                }
            }
    })
    socket.on("requestAllUsers", () => { //used on the admin page to get all the users on the page along with their departments
        var json = jsonRead ("data/users.json");
        var object = []
        for(var i = 0; i<json.table.length; i++){
            if(json.table[i].deps.includes("admin")){
                var newObject = {
                    "username":json.table[i].username,
                    "admin":true,
                    "deps": json.table[i].deps
                }
                object.push(newObject)
            }
            else{
                var newObject = {
                    "username":json.table[i].username,
                    "admin":false,
                    "deps": json.table[i].deps
                }
                object.push(newObject)
            }
            socket.emit("allUsers", object)
        }
    })
    socket.on("removeDep", (department, name) => { //used to remove departments
        var json = jsonRead("data/users.json")
        for(var i = 0; i<json.table.length; i++){
            if(json.table[i].username == name && json.table[i].deps.includes(department)){
                json.table[i].deps.splice(json.table[i].deps.indexOf(department), 1)
                jsonWrite(json, "data/users.json")
                return false;
            }
        }
        socket.emit("eror", "500 internal server error. Please report this code: REM_DEP:500, to the site developer")
    })
    socket.on("addDep", (department, name) => { //used to add depatments
        var json = jsonRead("data/users.json")
        for(var i = 0; i<json.table.length; i++){
            if(json.table[i].username == name && !json.table[i].deps.includes(department)){
                json.table[i].deps.push(department)
                jsonWrite(json, "data/users.json")
                return false;
            }
        }
        socket.emit("eror", "500, internal server error, Please report this code: ADD_DEP:500, to the site developer")
    })
    socket.on("log", (msg) => { //used when clients request to log somthing. Mostly acitons like adding or removing departments.
        log(msg)
    })
    socket.on("unitAdded", (unit, callID) => {
        calls.forEach(call => {
            if(call.callID == callID && !call.mainUnit.includes(unit)){
                call.mainUnit.push(`<li>${unit}</li>`)
                io.sockets.emit("currentCalls", calls)
            }
        })
    })
    socket.on("newGun", (gun, username, civName) => {
        var json = jsonRead(`data/${username}/civillians.json`)
        var found = false
        json.forEach(name => {
            if(name.Firstname+" "+name.Surname == civName){
                found = true
                var newObject = {
                    "gunName":gun,
                    "gunID":Math.random()
                }
                name.gunLicenses.push(newObject)
                socket.emit("GunCreated", newObject.gunID)
            }
        })
        if(!found){
            socket.emit("eror", "500 internal server error: could not find civillian supplied. Gun was not created")
        }
        else{
            jsonWrite(json ,`data/${username}/civillians.json`)
        }
    })
})
process.on("SIGINT", () => {
    console.log("server shutting down")
    log("-------------------------")
    log("server shutting down")
    log("-------------------------")
    process.exit()
})
process.on("uncaughtException", err => {
    console.log(`UncaugthException: ${err}, check log for more info`)
    log(`UncaugthException: ${err.stack}`, true)
})
function jsonRead(file){ //used to read json files 
    var temp = fs.readFileSync(file, "utf-8", (err) => {
        if(err) log(err); console.log(err)
    })
    var json = JSON.parse(temp)
    return json;
}
function jsonWrite(data, file){//used to write to json files
    fs.writeFile(file, JSON.stringify(data), (err) => {
        if(err) log(err); console.log(err)
    })
}
function log(msg, isErr){ //main logging function
    var date = new Date()
    var month = date.getMonth() +1
    var firstMinutes = date.getMinutes()
    var minutes
    if(firstMinutes < 10){
        minutes = "0"+firstMinutes
    }
    else{
        minutes = firstMinutes
    }
    var fullMsg = "["+date.getDate()+"."+month+"."+date.getFullYear()+" @ "+date.getHours()+":"+ minutes+"] "+msg
    if(!msg){
        log("tried to log with no message provided")
        return;
    }
    if(fs.existsSync("data/logs/log.log") && useLogs || fs.existsSync("data/logs/log.log") && isErr){
        fs.appendFileSync("data/logs/log.log", fullMsg+"\r\n")
    }
    else if(useLogs && fs.existsSync("data/logs") || isErr && fs.existsSync("data/logs")){
        fs.writeFileSync("data/logs/log.log", "["+date.getDate()+"."+month+"."+date.getFullYear()+" @ "+date.getHours()+":"+ minutes+"] Log file created, to disable logging check the index.js file: config section \r\n")
        fs.appendFileSync("data/logs/log.log", fullMsg+"\r\n")
    }
    else if(useLogs || isErr){
        fs.mkdirSync("data/logs")
        fs.writeFileSync("data/logs/log.log", "["+date.getDate()+"."+month+"."+date.getFullYear()+" @ "+date.getHours()+":"+ minutes+"] Log file created, to disable logging check the index.js file: config section \r\n")
        fs.appendFileSync("data/logs/log.log", fullMsg+"\r\n")
    }
}
//these lines exports the functions so that they can be used in other files. Mostly in the API
module.exports.jsonRead = jsonRead;
module.exports.jsonWrite = jsonWrite;
module.exports.log = log;
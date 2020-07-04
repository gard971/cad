var socket = io()
var returnNeeded; 
var callsignChange
    $(function(){
         if(localStorage.getItem("username") && localStorage.getItem("key") && sessionStorage.getItem("dep")){
             socket.emit("check", localStorage.getItem("username"), localStorage.getItem("key"), true)
         }
         else{
             window.location.href="index.html"
         }
    })
    $("#newCharacterForm").submit(function(e){
        e.preventDefault()
        var value = document.getElementById("newCharacterBuild")
        var selectValue = value.options[value.selectedIndex].value
        if(selectValue == "start"){alert("please select a build type")}
        else{
        var formInfo = {
            "Firstname":$("#newCharacterFirstname").val(),
            "Surname":$("#newCharacterSurname").val(),
            "BirthDate":$("#newCharacterBirthDate").val(),
            "Heigth":$("#newCharacterHeight").val(),
            "Build":selectValue,
            "license":"none",
            "warrants":[],
            "gunLicenses":[],
            "guns":[]
        }
        socket.emit("newCharacter",localStorage.getItem("username"), formInfo)
    }
    })
    $("#newVehicleForm").submit((e) => {
        e.preventDefault()
        var value = document.getElementById("newInsuranceSelect")
        var selectValue = value.options[value.selectedIndex].value
        if(selectValue == "start"){
            alert("please select a insurance status")
        }
        else{
            var array = [sessionStorage.getItem("civname"), localStorage.getItem("username"), $("#newLicensePlate").val(), $("#newColor").val(), $("#newType").val(), $("#newDoors").val(), selectValue]
            socket.emit("newVehicle", array)
        }
    })
    $("#databaseForm").submit((e) => {
        if(sessionStorage.getItem("dep") == "civillian" ||sessionStorage.getItem("dep") == "LSFD"){
            alert("you do not have access to use this")
        }
        else{
            socket.emit("check", localStorage.getItem("username"), localStorage.getItem("key"), true)
            e.preventDefault()
            socket.emit("databaseSearch", $("#databaseFirstname").val(), $("#databaseSurname").val())
        }
    })
    $("#plateSearchForm").submit((e) => {
        if(sessionStorage.getItem("dep") == "civillian" ||sessionStorage.getItem("dep") == "LSFD"){
            alert("you do not have access to use this")
        }
        else{
            socket.emit("check", localStorage.getItem("username"), localStorage.getItem("key"), true)
        e.preventDefault()
        socket.emit("plateSearch", $("#plateNumber").val())
        }
    })
    $("#addWarrantForm").submit((e) => {
        e.preventDefault()
        var name = [document.getElementById("firstnameInfo").innerHTML, document.getElementById("surnameInfo").innerHTML]
        socket.emit("newWarrant", name, $("#newWarrantTitle").val(), $("#newWarrantDes").val())
    })
    socket.on("deps", (array) => {
        var found = false
        if(sessionStorage.getItem("dep") == "debug"){
            for(var i = 0; i<array.length; i++){
                if(array[i] == "admin"){
                    return false;
                }
            }
            window.location.href="index.html"
            return false;
        }
        for(var i = 0; i<array.length; i++){
            if(array[i] == sessionStorage.getItem("dep")){
                found = true
                if(callsignChange == true){
                    var value = document.getElementById("statusSelect")
                    var selectValue = value.options[value.selectedIndex].value
                    if(selectValue == "start"){var status = "10-7"} else{var status = selectValue}
                    if(sessionStorage.getItem("callsign")){
                        socket.emit("callsign", sessionStorage.getItem("callsign"), $("#callsign").val(), status)
                    sessionStorage.setItem("callsign", $("#callsign").val())
                    document.getElementById("callsignParam").innerHTML = $("#callsign").val()
                    }
                    else{
                        socket.emit("callsign", -1, $("#callsign").val(), status)
                        sessionStorage.setItem("callsign", $("#callsign").val)
                        document.getElementById("callsignParam").innerHTML = $("#callsign").val()
                    }
                }
            }
        }
        if(!found){
            alert("you do not have access to this department")
            window.location.href="dep.html"
        }
        if(found && sessionStorage.getItem("dep") == "LSPD" || sessionStorage.getItem("dep") == "LSCS" || sessionStorage.getItem("dep") == "LSHP"){
            windowHandle("database", false)
            windowHandle("vehicleCont", false)
            windowHandle("comsCont", false)
        }
        else if(sessionStorage.getItem("dep") == "civillian"){
            windowHandle("selectCharacter", false)
            socket.emit("requestCivs", localStorage.getItem("username"))
        }
    })
    socket.on("unitLoggedIn", (units) => {
        console.log("unitlogg")
        for(var i = 0; i<units.length; i++){
            if(units[i].callsign == document.getElementById("callsign").value){
                $("#statusSelect").remove($("#fromDisptach"))
                $("#statusSelect").empty()
                $("#statusSelect").append('<option disabled selected id='+units[i].status+' >'+units[i].status+'</option><option value="10-7">10-7</option><option value="10-8">10-8</option><option value="10-6">10-6</option>')
                console.log("append")
            }
        }
    })
    socket.on("logUnitOut", (unit) => {
        if(unit == sessionStorage.getItem("callsign")){
            alert("dispatch has logged you out of the MDT. You will be prompted to login again")
            localStorage.clear()
            window.location.href="index.html"
        }
    })
    socket.on("notAllowed", () => {
        window.location.href="index.html"
    })
    socket.on("civs", (civs) => {
        if(civs != false){
            for(var i = 0; i<civs.length; i++){
                var name = civs[i].Firstname+" "+civs[i].Surname
                $("#selectCharacterSelect").append("<option value='"+name+"'>"+name+"</option>")
            }
        }
    })
    socket.on("characterExists", () => {
        alert("this character alredy exists")
    })
    socket.on("characterCreated", () => {
        window.location.reload()
        console.log("idk")
    })
    socket.on("civInfo", (civ) => {
        socket.emit("check", localStorage.getItem("username"), localStorage.getItem("key"), true)
        $("#warrantsUL").empty()
        $("#gunsUL").empty()
        if(civ == false){
            alert("No results")
        }
        else{
            windowHandle('databaseCont', true)
            windowHandle("databaseInfo", false)
            document.getElementById("firstnameInfo").innerHTML = civ.Firstname
            document.getElementById("surnameInfo").innerHTML = civ.Surname
            document.getElementById("birthDateInfo").innerHTML = civ.BirthDate
            document.getElementById("buildTypeInfo").innerHTML = civ.Build
            if(civ.license != ""){
                document.getElementById("licensesInfo").innerHTML = civ.license
                $("#changeLicenseSelect").append("<option selected hidden disabled value="+civ.license+">"+civ.license+"</option>")
            }
            else{
                document.getElementById("licensesInfo").innerHTML = "none"
                $("#changeLicenseSelect").append("<option selected hidden disabled value=none>none</option>")

            }
            if(civ.warrants == ""){

                $("#warrantsUL").append("<li style='color:green;'>none</li>")
            }
            else{
                for(var i = 0; i<civ.warrants.length; i++){
                    $("#warrantsUL").append("<li style='color:red;'>Title: "+civ.warrants[i].title+" <br>Description: "+civ.warrants[i].description+"</li><br>")
                }
            }
            if(civ.guns == ""){
                $("#gunsUL").append("<li style='color:green;'>none</li>")
            }
            else{
                civ.guns.forEach(gun => {
                    $("#gunsUL").append(`<li style='color:orange;'>${gun.gunName} ID: ${gun.gunID}</li>`)
                })
            }
        }
    })
    socket.on("plateReturn", (plateReturn) => {
        if(plateReturn == false){
            alert("no matches found")
        }
        else{
            windowHandle("carDataCont", true)
            windowHandle("vehicleInfo", false)
           document.getElementById("licensePlateInfo").innerHTML = plateReturn.plate
           document.getElementById("colorInfo").innerHTML = plateReturn.color
           document.getElementById("typeInfo").innerHTML = plateReturn.type
           document.getElementById("doorsInfo").innerHTML = plateReturn.doors
           document.getElementById("ownerInfo").innerHTML = plateReturn.registerdOwner
           document.getElementById("insuranceInfo").innerHTML = plateReturn.insuranceStatus



         
        }
    })
    socket.on("vehicleCreated", () => {
        alert("vehicle created")
        document.getElementById("newVehicleForm").reset()
        windowHandle('newVehicleCont', true)
    })
    socket.on("vehicleExists", () => {
        alert("this plate already exists")
    })
    socket.on("illegalScript", () => {
        alert("error: illegal string, string contained '<script>' tag")
    })
    socket.on("licenseFound", (license) => {
        console.log("test")
        if(license == ""){
            license = "none"
        }
        document.getElementById("licenseStatusVar").innerHTML = license
        $("#licenseHubSelect").append("<option selected disabled hidden value="+license+">"+license+"</option>")
    })
    socket.on("warrantsUpdated", () => {
        socket.emit("databaseSearch", $("#databaseFirstname").val(), $("#databaseSurname").val())
    })
    socket.on("newCall", (call) => {
        console.log(call.mainUnit)
        call.mainUnit.forEach(unit => {
            var AssignedUnits = unit.toString().split("<li>").join("").split("</li>")
            AssignedUnits.forEach(assignedUnit => {
                if(assignedUnit == sessionStorage.getItem("callsign")){
                    document.getElementById("currentCallVar").innerHTML = call.Code10
                    sessionStorage.setItem("call", call.callID)
                }
            })
        })
        if(call.mainUnit == sessionStorage.getItem("callsign")){
            document.getElementById("currentCallVar").innerHTML = call.Code10
            sessionStorage.setItem("call", call.callID)
        }
    })
    socket.on("callDeleted", (call) => {
        if(call == sessionStorage.getItem("call")){
            document.getElementById("currentCallVar").innerHTML = "None"
        }
    })
    socket.on("GunCreated", (id) => {
        alert(`Gun created with uniqe ID of '${id}'`)
    })
    function windowHandle(window, action){
       document.getElementById(window).hidden = action
    }
    function status(){
        var value = document.getElementById("statusSelect")
        var selectValue = value.options[value.selectedIndex].value
        socket.emit("statusChange", selectValue, sessionStorage.getItem("callsign"))
    }
    function callsign(){
        if(sessionStorage.getItem("dep") == "civillian"){
            alert("you do not have access to this")
            window.location.reload()
        }
        check(true)
        callsignChange = true
    }
    function unload(){
        socket.emit("removeCallsign", sessionStorage.getItem("callsign"))
    }
    function logout(){
        socket.emit("logOut", localStorage.getItem("username"))
        localStorage.clear()
        sessionStorage.clear()
        window.location.href="index.html"
    }
    function createNewCharacter(){
        document.getElementById("selectCharacter").hidden = true
        document.getElementById("newCharacterCont").hidden = false

    }
    function selectCharacter(){
        var value = document.getElementById("selectCharacterSelect")
        var selectValue = value.options[value.selectedIndex].value
        sessionStorage.setItem("civname", selectValue)
        windowHandle("selectCharacter", true)
        windowHandle('DMVIconCont', false)
        windowHandle("atfIconCont", false)
    }
    function grabLicense(){
        socket.emit("grabLicense", sessionStorage.getItem("civname"), localStorage.getItem("username"))
    }
    function changeLicense(civ){
        if(civ){
        check(false)
        var value = document.getElementById("licenseHubSelect")
        var selectValue = value.options[value.selectedIndex].value
        socket.emit("changeLicense", localStorage.getItem("username"), sessionStorage.getItem("civname"), selectValue)
        document.getElementById("licenseStatusVar").innerHTML = selectValue
        $("#licenseHubSelect").append("<option selected hidden disabled value="+selectValue+">"+selectValue+"</option>")
        }
        else{
            check(true)
            var value = document.getElementById("changeLicenseSelect")
            var selectValue = value.options[value.selectedIndex].value
            var name  = document.getElementById("firstnameInfo").innerHTML+" "+document.getElementById("surnameInfo").innerHTML
            socket.emit("policeChangeLicense", name, selectValue)
            $("#changeLicenseSelect").append("<option selected hidden disabled value="+selectValue+">"+selectValue+"</option>")
            document.getElementById("licensesInfo").innerHTML = selectValue

        }

    }
    function removeAllWarrants(){
        var array = [document.getElementById("firstnameInfo").innerHTML, document.getElementById("surnameInfo").innerHTML]
        socket.emit("removeWarrant", "all", array)
    }
    function registerNewGun(){
        var username = localStorage.getItem("username")
        var name = sessionStorage.getItem("civname")
        var gun = $("#gunTypeInput").val()
        socket.emit("newGun", gun, username, name)
    }

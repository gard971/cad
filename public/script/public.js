var allDepartments = ["LSPD", "civillian", "SAHP", "LSCS", "communications"]
socket.on("eror", (msg) => {
    alert(msg)
    console.error("ERROR server returned a status of 500 with following message: '"+msg+"'")
})
socket.on("refresh", () => {
    alert("The server requested all clients to refresh the page. Probably becuase of a server restart. This will now automaticly happen")
    window.location.reload()
})
function check(needDeps){
    if(typeof(needDeps) != "boolean"){
        console.error("needDeps was not type of boolean. Operation canceled")
        return;
    }
    socket.emit("check", localStorage.getItem("username"), localStorage.getItem("key"), needDeps)
}
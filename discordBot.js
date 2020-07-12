//config:

var password = ""
var prefix = "!"
var APIPassword = "test"


//code
const http = require("http")
const discord = require("discord.js")
const fs = require("fs")
const main = require("./index")
const {
    raw
} = require("express")
const {
    compareSync
} = require("bcrypt")
const bot = new discord.Client()
var LoggedInUsers = []
bot.login(password)


bot.on("ready", () => {
    console.log("bot ready")
})

bot.on("message", msg => {
    var prefixInput = msg.content.substring(0, prefix.length)
    if (prefixInput == prefix) {
        var args = msg.content.substring(prefix.length).split(" ")
        var command = args[0]
        args.splice(0, 1)
        switch (command) {
            case "PersonSearch":
                var found = false
                if (!args[0] || !args[1]) {
                    msg.channel.send(`missing arguments. Usage: ${prefix}PersonSearch firstname lastname`)
                } else {
                    main.LEODepartments.forEach(LEODep => {
                        if (msg.member.roles.cache.find(r => r.name == LEODep)){
                            found = true
                        }
                    })
                    if (found) {
                        http.get(`http://localhost/api?action=personSearch&password=${APIPassword}&name=${args[0]}%20${args[1]}`, res => {
                            const {
                                statusCode
                            } = res;
                            if (statusCode != 200) {
                                new Error("Request Failed")
                            } else {
                                res.setEncoding("utf-8")
                                let rawData = ""
                                res.on("data", chunk => {
                                    rawData += chunk
                                })
                                res.on("end", () => {
                                    var avatarURL
                                    try {
                                        const parsedData = JSON.parse(rawData)
                                        if (parsedData.license == "") {
                                            parsedData.license = "none"
                                        }
                                        const embed1 = new discord.MessageEmbed()
                                            .setTitle(`**info on ${parsedData.Firstname} ${parsedData.Surname}**`)
                                            .addField(`DOB:`, ` ${parsedData.BirthDate}`)
                                            .addField(`Heigth:`, ` ${parsedData.Heigth}`)
                                            .addField(`Build:`, ` ${parsedData.Build}`)
                                            .addField(`License Status:`, ` ${parsedData.license}`)
                                            .setTimestamp();
                                        bot.users.fetch("279292405029535744").then(user => {
                                            embed1.setFooter(`cad system by ${user.username}`, user.avatarURL())
                                            if (!parsedData.warrants.length) {
                                                embed1.addField("Warrants:", "None")
                                                embed1.setColor("GREEN")
                                            } else {
                                                embed1.addField("Warrants:", `${parsedData.warrants.length-1} outstanding warrant(s)`)
                                                embed1.setColor("RED")
                                            }
                                            msg.author.send(embed1).then(() => {
                                                msg.reply("check your DM").then(msgFromBot => {
                                                    msgFromBot.delete({
                                                        timeout: 9000
                                                    })
                                                })
                                            })
                                        })
                                    } catch (e) {
                                        console.log(e)
                                        msg.channel.send(rawData).then(msgFromBot => {
                                            msgFromBot.delete({
                                                timeout: 9000
                                            })
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        msg.reply("You do not have access to any LEO department!").then(msgFromBot => {
                            msgFromBot.delete({
                                timeout: 9000
                            })
                        })
                    }
                }
                break;
            case "BD":
                if (!args[0]) {
                    msg.reply("Either missing arguments or argument was not a number").then(msgFromBot => {
                        msgFromBot.delete({
                            timeout: 9000
                        })
                    })
                } else {
                    msg.channel.bulkDelete(args[0] + 1)
                }
                break;
            case "licensePlate":
                if (!args[0]) {
                    msg.channel.send(`Missing arguments. Usage: ${prefix}licensePlate plateHere`).then(msgFromBot => {
                        msgFromBot.delete({
                            timeout: 9000
                        })
                    })
                } else {
                    var found = false
                    main.LEODepartments.forEach(LEODep => {
                        if(msg.member.roles.cache.find(r => r.name == LEODep)){
                            found = true
                        }
                    })
                    if (found) {
                        found = true
                        http.get(`http://localhost/api?action=licensePlate&password=${APIPassword}&plate=${args[0]}`, res => {
                            const {
                                statusCode
                            } = res
                            if (statusCode != 200) {
                                console.error("Request failed")
                            } else {
                                res.setEncoding("utf-8")
                                let rawData = ""
                                res.on("data", chunk => {
                                    rawData += chunk
                                })
                                res.on("end", () => {
                                    try {
                                        const parsedData = JSON.parse(rawData)
                                        var embed = new discord.MessageEmbed()
                                            .setTitle(`**info on vehicle ${parsedData.plate}**`)
                                            .addFields({
                                                name: `color:`,
                                                value: parsedData.color
                                            }, {
                                                name: `type:`,
                                                value: parsedData.type
                                            }, {
                                                name: `doors`,
                                                value: parsedData.doors
                                            }, {
                                                name: `RO`,
                                                value: parsedData.registerdOwner
                                            })
                                            .setTimestamp();
                                        bot.users.fetch("279292405029535744").then(user => {
                                            embed.setFooter(`cad system by ${user.username}`, user.avatarURL())
                                            msg.author.send(embed).then(() => {
                                                msg.reply("check your dm").then(msgFromBot => {
                                                    msgFromBot.delete({
                                                        timeout: 9000
                                                    })
                                                })
                                            })
                                        })
                                    } catch (e) {
                                        console.log(e)
                                        msg.channel.send(rawData).then(msgFromBot => {
                                            msgFromBot.delete({
                                                timeout: 9000
                                            })
                                        })
                                    }
                                })
                            }
                        })
                    }
                    else{
                        msg.reply("you do not have access to any LEO department").then(msgFromBot => {
                            msgFromBot.delete({timeout: 9000})
                        })
                    }
                }
                break;
            case "Register":
                msg.delete()
                if (!args[0] || !args[1] || !args[2]) {
                    msg.channel.send(`Missing args. Usage: ${prefix}register username password confirmPassword`)
                } else {
                    http.get(`http://localhost/api?action=register&username=${args[0]}&password=${args[1]}`, res => {
                        const {
                            statusCode
                        } = res
                        if (statusCode != 200) {
                            console.error("request failed")
                        } else {
                            let rawData = ""
                            res.on("data", chunk => {
                                rawData += chunk
                            })
                            res.on("end", () => {
                                msg.channel.send(rawData).then(msgFromBot => {
                                    msgFromBot.delete({
                                        timeout: 9000
                                    })
                                })
                            })
                        }
                    })
                }
                break;
        }
    }
})

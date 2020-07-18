print("^2Cad intergration by Gard started^7")
LEOs = {}
LEOBlips = {}
RegisterNetEvent("addCode99Blip")
RegisterNetEvent("AddBlip")
AddEventHandler("AddBlip", function(source)
    found = false
    for i, leo in pairs(LEOs) do if (LEOs[i] == source) then found = true end end
    if found == true then
        TriggerClientEvent("addBlip", source)
    else
        TriggerClientEvent("chat:addMessage", source,
                           {args = {"You are not an leo"}})
    end
end, false)
RegisterNetEvent("duty")
AddEventHandler("duty", function(args)
    isLEO = true
    for i, leo in pairs(LEOs) do
        if (LEOs[i] == args[1]) then
            isLEO = false
            table.remove(LEOs, i)
        end
    end
    if args[2] == "test" and isLEO == true then
        table.insert(LEOs, 1, source)
        TriggerClientEvent("isLEO", args[1])
        TriggerClientEvent("chat:addMessage", args[1],
                           {args = {"You have cloked in as LEO", LEOs}})

    else
        if isLEO == false then
            TriggerClientEvent("isNotLeo", args[1])
            TriggerClientEvent("chat:addMessage", args[1],
                               {args = {"you have clokcked out as leo", LEOs}})
        else
            TriggerClientEvent("chat:addMessage", args[1],
                               {args = {"Wrong password"}})
        end
    end
end)
AddEventHandler("addCode99Blip", function(params)
    pos = params[1]
    source = params[2]
    table.insert(LEOBlips, 1, pos)
    newParams = {LEOs, source, pos}
    TriggerClientEvent("code99BlipCreated", -1, newParams)
end)
RegisterNetEvent("performHTTPGET")
AddEventHandler("performHTTPGET", function(params) 
    PerformHttpRequest(params[2], function(errorCode, resultData, resultHeader)
        if(params[3] == "person") then 
        TriggerClientEvent("personReturn", params[1], resultData)
        else if params[3] == "plate" then 
            TriggerClientEvent("plateReturn", params[1], resultData)
        end
    end
    end)
end)
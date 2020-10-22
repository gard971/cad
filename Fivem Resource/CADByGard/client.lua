local APIKey = "test"

local lastBlip = false
local lastBlipEntity
local blip
local allBlips = {}
local isRemoveCode99Enabled = false
local isLEO = false
local plateMenu
local makeSubMenu = false
RegisterNetEvent("isLEO")
AddEventHandler("isLEO", function() isLEO = true end)
RegisterNetEvent("isNotLeo")
AddEventHandler("isNotLeo", function() isLEO = false end)
RegisterNetEvent("addBlip")
AddEventHandler("addBlip", function(source)
    isRemoveCode99Enabled = true
    local ped = PlayerPedId()
    local pos = GetEntityCoords(ped)
    blip = AddBlipForCoord(pos.x, pos.y, pos.z)
    SetBlipSprite(blip, 56)
    BeginTextCommandSetBlipName("STRING")
    local stringText = "CODE 99 OFFICER IN DISTRESS"
    AddTextComponentString(stringText)
    EndTextCommandSetBlipName(blip)
    SetBlipAlpha(blip, 255)
    SetBlipDisplay(blip, 2)
    SetBlipColour(blip, 1)
    params = {pos, source}
    newobject = {pos, blip}
    table.insert(allBlips, 1, newobject)
    for i, blip in pairs(allBlips) do end
    TriggerServerEvent("addCode99Blip", params)
end)
RegisterNetEvent("code99BlipCreated")
AddEventHandler("code99BlipCreated", function(params)
    LEOs = params[1]
    source = params[2]
    local found = false
    local pos = params[3]
    for i, leo in pairs(LEOs) do if LEOs[i] == source then found = true end end
    if pos ~= lastBlip and found == true then
        local blip = AddBlipForCoord(pos.x, pos.y, pos.z)
        SetBlipSprite(blip, 56)
        BeginTextCommandSetBlipName("STRING")
        local stringText = "CODE 99 OFFICER IN DISTRESS"
        AddTextComponentString(stringText)
        EndTextCommandSetBlipName(blip)
        SetBlipAlpha(blip, 255)
        SetBlipDisplay(blip, 2)
        SetBlipColour(blip, 1)
        newObject = {pos, blip}
        table.insert(allBlips, 1, newObject)
    end
    print(pos)
    print(lastBlip)
    if pos ~= lastBlip and lastBlip ~= false then
        TriggerEvent("RemoveBlip", lastBlip)
        RemoveBlip(lastBlipEntity)
        TriggerEvent("removeBlip", lastBlip)
    end
    lastBlip = pos
    lastBlipEntity = blip
end)
RegisterNetEvent("RemoveBlip")
AddEventHandler("RemoveBlip", function(pos)
    for i, blip in pairs(allBlips) do
        if (allBlips[i][1] == pos) then
            RemoveBlip(allBlips[i][2])
            table.remove(allBlips, i)
        end
    end
end)

-- menus
local menuReturn = RageUI.CreateMenu("Database Return", "Database Return") -- menu for person database return
local menu = RageUI.CreateMenu("Police Menu", "Police menu") -- main police menu

RageUI.CreateWhile(1.0, menu, nil, function()
    RageUI.IsVisible(menu, true, true, true, function()
        RageUI.Button("Clock in/out", "login or out as an LEO", true,
                      function(Hovered, Active, Selected)
            if (Selected) then

                local keyboardReturn = KeyboardInput("password",
                                                     "Please input the LEO password",
                                                     99)
                print(keyboardReturn)
                local args = {GetPlayerServerId(PlayerId()), keyboardReturn, 99}
                TriggerServerEvent("duty", args)
            end
        end)
        RageUI.Button("Cancel panic", "Remove code 99 blip",
                      isRemoveCode99Enabled, function(Hovered, Active, Selected)
            if (Selected) then
                RemoveBlip(lastBlipEntity)
                TriggerEvent("RemoveBlip", lastBlip)
                isRemoveCode99Enabled = false
            end

        end)
        RageUI.Button("Panic button", "add code 99 blip", isLEO,
                      function(Hovered, Active, Selected)
            if (Selected) then
                TriggerServerEvent("AddBlip", GetPlayerServerId(PlayerId()))
            end

        end)
        RageUI.Button("Person database", "search up name in the cad", isLEO,
                      function(Hovered, Active, Selected)
            if (Selected) then
                local name = KeyboardInput(
                                 "Please input the name you want to search",
                                 "Firstname Lastname", 20)
                if name then
                    local nameArray = string.split(name, " ", 99)
                    if #nameArray == 2 then
                    count = 0
                    for _ in pairs(nameArray) do
                        count = count + 1
                    end
                    if count > 2 then
                        TriggerEvent("chat:addMessage",
                                     {args = {"Too many names!"}})
                    else
                        print(nameArray[1] .. " " .. nameArray[2])
                        local args = {
                            GetPlayerServerId(PlayerId()),
                            "http://localhost/api?action=personSearch&password=" ..
                                APIKey .. "&name=" .. nameArray[1] .. "%20" ..
                                nameArray[2], "person"
                        }
                        TriggerServerEvent("performHTTPGET", args)
                    end
                end
                end
            end
        end)
        RageUI.Button("Vehicle database", "serch up license plates in the cad",
                      isLEO, function(Hovered, Active, Selected)
            if (Selected) then
                local plate = KeyboardInput("Please input plate", "plate", 20)
                if plate then 
                local args = {
                    GetPlayerServerId(PlayerId()),
                    "http://localhost/api?action=licensePlate&password="..APIKey.."&plate=" ..
                        plate, "plate"
                }
                TriggerServerEvent("performHTTPGET", args)
                RageUI.CloseAll()
            end
            end
        end)
    end)
end)

local name
local DOB
local Height
local Build
local License
local count
local warrantsbool
local warrantMenu

RegisterNetEvent("personReturn") -- Handles returns from the person database
AddEventHandler("personReturn", function(data)
    warrantMenu = RageUI.CreateSubMenu(menuReturn, "Warrants", "Warrants")
    local parsedData = json.decode(data)
    warrantsbool = false
    if parsedData == nil then
        TriggerEvent("chat:addMessage", {args = {data}})
    else
        if parsedData.license == "" then parsedData.license = "None" end
        name = parsedData.Firstname .. " " .. parsedData.Surname
        DOB = parsedData.BirthDate
        Height = parsedData.Heigth
        Build = parsedData.Build
        License = parsedData.license
        count = 0
        RageUI.Visible(menu, false)
        TriggerEvent('chat:addMessage', {
            multiline = false,
            args = {"__________________________"}
        })
        TriggerEvent('chat:addMessage', {
            multiline = false,
            args = {"[name] ".. name}
        })
        TriggerEvent('chat:addMessage', {
            multiline = false,
            args = {"[DOB] ".. DOB}
        })
        TriggerEvent('chat:addMessage', {
            multiline = false,
            args = {"[Height] ".. Height}
        })
        TriggerEvent('chat:addMessage', {
            multiline = false,
            args = {"[Build] ".. Build}
        })
        TriggerEvent('chat:addMessage', {
            multiline = false,
            args = {"[License Status] ".. License}
        })   TriggerEvent('chat:addMessage', {
            multiline = false,
            args = {"__________________________"}
        })
    end
end)
RegisterNetEvent("WarrantsRemoved")
AddEventHandler("WarrantsRemoved", function() 
    local nameArray = string.split(name, " ", 99)
    if #nameArray == 2 then
        local args = {GetPlayerServerId(PlayerId()), "http://localhost/api?action=personSearch&password="..APIKey.."&name="..nameArray[1].."%20"..nameArray[2], "person"}
        TriggerServerEvent("performHTTPGET", args)
    end
end)
RageUI.CreateWhile(1.0, menuReturn, nil, function()
    RageUI.IsVisible(menuReturn, true, true, true, function()
        RageUI.Button("Name: " .. name, "Suspect Name", false)
        RageUI.Button("DOB: " .. DOB, "date of birth", false)
        RageUI.Button("Height: " .. Height, "suspect height", false)
        RageUI.Button("Build: " .. Build, "suspect build", false)
        RageUI.Button("License Status: " .. License, "suspect license status",
                      false)
        RageUI.Button("Warrant(s): " .. count, "suspect ammount of warrants",
                      warrantsbool, function(Hovered, Active, Selected)
            if (Selected) then RageUI.Visible(warrantMenu, true) end
        end)
    end)
end)

RegisterNetEvent("plateReturn") -- handles database returns from the plate database
AddEventHandler("plateReturn", function(data)
    local parsedData = json.decode(data)
    if parsedData == nil then
        print("data == nil")
        TriggerEvent("chat:addMessage", {args = {data}})
    else
        TriggerEvent("chat:addMessage", {args = {"__________________________"}})
        TriggerEvent("chat:addMessage", {args = {"[Plate] ".. parsedData.plate}})
        TriggerEvent("chat:addMessage", {args = {"[color] ".. parsedData.color}})
        TriggerEvent("chat:addMessage", {args = {"[Type] ".. parsedData.type}})
        TriggerEvent("chat:addMessage", {args = {"[RO] ".. parsedData.registerdOwner}})
        TriggerEvent("chat:addMessage", {args = {"__________________________"}})
        RageUI.Visible(menu, false)
    end
end)
function changePersonReturn(object) end

-- Open police menu
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1)
        if IsControlJustPressed(0, 38) then
            RageUI.Visible(menu, not RageUI.Visible(menu))
        end
    end
end)
function KeyboardInput(TextEntry, ExampleText, MaxStringLenght)

    -- TextEntry		-->	The Text above the typing field in the black square
    -- ExampleText		-->	An Example Text, what it should say in the typing field
    -- MaxStringLenght	-->	Maximum String Lenght

    AddTextEntry('FMMC_KEY_TIP1', TextEntry) -- Sets the Text above the typing field in the black square
    DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP1", "", ExampleText, "", "", "",
                            MaxStringLenght) -- Actually calls the Keyboard Input
    blockinput = true -- Blocks new input while typing if **blockinput** is used

    while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do -- While typing is not aborted and not finished, this loop waits
        Citizen.Wait(0)
    end

    if UpdateOnscreenKeyboard() ~= 2 then
        local result = GetOnscreenKeyboardResult() -- Gets the result of the typing
        Citizen.Wait(500) -- Little Time Delay, so the Keyboard won't open again if you press enter to finish the typing
        blockinput = false -- This unblocks new Input when typing is done
        return result -- Returns the result
    else
        Citizen.Wait(500) -- Little Time Delay, so the Keyboard won't open again if you press enter to finish the typing
        blockinput = false -- This unblocks new Input when typing is done
        return nil -- Returns nil if the typing got aborted
    end
end
-- Split a string into a table using a delimiter and a limit
string.split = function(str, pat, limit)
    local t = {}
    local fpat = "(.-)" .. pat
    local last_end = 1
    local s, e, cap = str:find(fpat, 1)
    while s do
        if s ~= 1 or cap ~= "" then table.insert(t, cap) end

        last_end = e + 1
        s, e, cap = str:find(fpat, last_end)

        if limit ~= nil and limit <= #t then break end
    end

    if last_end <= #str then
        cap = str:sub(last_end)
        table.insert(t, cap)
    end

    return t
end
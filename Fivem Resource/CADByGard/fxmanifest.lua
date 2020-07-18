
fx_version 'adamant'
games { 'gta5' };
author "Gard Søreng"
description "A resource to go with the cad made by Gard Søreng"

games {"gta5"}
name "CadByGardFivem integration"
client_scripts {
    "src/client/RMenu.lua",
    "src/client/menu/RageUI.lua",
    "src/client/menu/Menu.lua",
    "src/client/menu/MenuController.lua",

    "src/client/components/*.lua",

    "src/client/menu/elements/*.lua",

    "src/client/menu/items/*.lua",

    "src/client/menu/panels/*.lua",

    "src/client/menu/windows/*.lua",

    "client.lua"

}
server_script "server.lua"


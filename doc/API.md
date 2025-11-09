# CrackleSDK API
This file will describe the functions/variables you have access to from the `api` variable in your mod's main function. (Note: The code containing all of these functions are in `api.js`)

# Variables
* `ide` - The `IDE_Morph` (check Snap!'s `gui.js` for more infomation) Snap! is using. This is the Snap! interface.
* `world` - The `WorldMorph` (check Snap!'s `morphic.js` for more infomation) Snap! uses. This the thing that contains the IDE.

# Functions
* `showMsg` - Show a basic message to the user.
* `addApi` - Add a "extra API" to the Crackle API. This is useful for libraries. This is added to new mods `api` objects. (Note that this currently doesn't modify existing mods)
* `inform` - Inform the user of something, with a title.
# CrackleSDK API
This file will describe the interface you have with mods, both the `api` variable, the `Mod` object, and `Mod` events.

## Mod structure
A typical mod file is a simple "return" statement, returing a object containing metadata about the mod and its code. Here is a example:
```js
return {
    // Metadata
    id: "example-mod", // the id of the mod
    name: "Example Mod", // human-readable name
    description: "A example mod for CrackleSDK.", // description
    version: "1.0", // version
    author: "Your Name", // author
    depends: [], // dependencies (mod ids, useful for libraries)
    doMenu: true, // whether to add a menu item

    // Main function - gets ran when the mod is loaded
    main(api) {
        // ...
    },

    // Cleanup functions - get ran when the mod is "deleted"
    cleanupFuncs: [
        // ...
    ],
}
```

Read the comments contained in the example for what each objec property does. Your mod is loading by calling the `main` function, passing in a `api` object (described in API).

## API
This section describes the variables/functions in the `api` variable.

### Variables
* `ide` - The `IDE_Morph` (check Snap!'s `gui.js` for more infomation) Snap! is using. This is the Snap! interface.
* `world` - The `WorldMorph` (check Snap!'s `morphic.js` for more infomation) Snap! uses. This the thing that contains the IDE.

### Functions
* `showMsg` - Show a basic message to the user.
* `addApi` - Add a "extra API" to the Crackle API. This is useful for libraries. This is added to new mods `api` objects. (Note that this currently doesn't modify existing mods)
* `inform` - Inform the user of something, with a title.

## `this` in `main`
The object stored in `this` when you call main is actually NOT the object you returned. Yes, most of it is copied, but its actually a `Mod` object (contained in `mod.js`). This mod object actually support events, by using EventTarget. You can `addEventListener` and such, just like DOM elements. The section following contains those events you can attach to.

### Events
* `projectCreating` - Triggered whenever the current project is about to be replaced with a new one. You can cancel this action by calling "preventDefault" on it.
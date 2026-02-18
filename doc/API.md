# Sparkle API
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

Read the comments contained in the example for what each object property does. Your mod is loaded by calling the `main` function, passing in a `api` object (described in API).

## API
This section describes the variables/functions in the `api` variable.

### Variables
* `ide` - The `IDE_Morph` (check Snap!'s `gui.js` for more infomation) Snap! is using. This is the Snap! interface.
* `world` - The `WorldMorph` (check Snap!'s `morphic.js` for more infomation) Snap! uses. This is the thing that contains the IDE.

### Functions
* `showMsg` - Show a basic message to the user.
* `addApi` - Add a "extra API" to the Sparkle API. This is useful for libraries. This is added to new mods' `api` objects. (Note that this currently doesn't modify existing mods)
* `inform` - Inform the user of something, with a title.
* `registerMenuHook` - Attach a menu hook. This is only included for compatibility with Crackle and should not be used in new mods.
* `registerEventTarget` - Register an event target with the Sparkle event system.

## `this` in `main`
The object stored in `this` when you call main is actually NOT the object you returned. Yes, most of it is copied, but its actually a `Mod` object (contained in `mod.js`). This mod object actually supports events, by using EventTarget. You can `addEventListener` and such, just like DOM elements. The section following contains those events you can attach to.

## Tips
What follows are several "tips" on modding.

### 1. Hooking
In Crackle, there was a very fragile hooking system where mods would manually overwrite Snap!'s core functions. In Sparkle, this has been replaced by the `EventTarget` system.

As you have learned, each mod is passed an `api` object upon load that provides various high-level utility functions. It also supplies a variable named `api.sparkleEventTarget` that lets your mod listen for events from Sparkle.

Here's an example of a mod that issues an `alert()` upon the user creating a category:
~~~js
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
        api.registerEventTarget(api.sparkleEventTarget); api.sparkleEventTarget.addEventListener("categoryCreated", (e) => {alert(e.detail.name)});
    },

    // Cleanup functions - get ran when the mod is "deleted"
    cleanupFuncs: [
    	// Sparkle removes your EventTarget upon mod removal, so no cleanup is needed here.
    ]
}
~~~

Notice how the mod immediately runs `registerEventTarget` on startup; this lets Sparkle know about the mod's intent to listen for events and lets it provide high-level hooking functionality. Whenever your mod is removed by the user, Sparkle automatically unhooks any event listeners in order to save time for mod developers.

For historical reasons, Sparkle still has support for the legacy Crackle hooking system, but mods designed for Sparkle are heavily advised to use the new system instead.

### Events
* `projectCreating` - Triggered whenever the current project is about to be replaced with a new one. You can cancel this action by calling "preventDefault" on it.
* `projectCreated` - Triggered after a project is created, if it was not cancelled by another event
* `categoryCreating` - Triggered whenever a new category is about to be created. You can cancel this action by calling "preventDefault" on it. The 'detail' property of the event object contains the `name` and `color` (Color) of the category.
* `categoryCreated` - Triggered after a category is created, if it was not cancelled by another event. 'detail' is the same as categoryCreating.

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

## Tips
What follows are several "tips" on modding.

### 1. Hooking
One thing you might want to do in your modding journey is do something (in your own code) when a Snap! function is called. The easiest way to do this is to keep a copy of the old function in the object's prototype, replace the main function of it, call that old function first, last, or in the middle somewhere, and then finally do your code. Heres a example with `StageMorph.prototype.setScale`:
```js
StageMorph.prototype._setScale = StageMorph.prototype.setScale;

StageMorph.prototype.setScale = function (scale) {
    this._setScale(scale);

    console.log("New stage scale: " + scale.toString);
}
```

And then, you can also implement a function to delete that hook in your `cleanupFuncs`:
```js
() => {
    StageMorph.prototype.setScale = StageMorph.prototype._setScale;

    delete StageMorph.prototype._setScale;
}
```
The `delete` part is optional.

Hooking is one of the most useful skills in modding, and its a good thing to learn it for the future. Even if you want to implement a new feature, but want to include in one of the Snap! menus - you'd will have to do some hooking. Even though that is one of the harder things to do - maybe eventually we should have a API for adding new stuff to common Snap! menus.

### Events
* `projectCreating` - Triggered whenever the current project is about to be replaced with a new one. You can cancel this action by calling "preventDefault" on it.
* `projectCreated` - Triggered after a project is created, if it was not cancelled by another event
* `categoryCreating` - Triggered whenever a new category is about to be created. You can cancel this action by calling "preventDefault" on it. The 'detail' property of the event object contains the `name` and `color` (Color) of the category.
* `categoryCreated` - Triggered after a category is created, if it was not cancelled by another event. 'detail' is the same as categoryCreating.
return class extends Mod {
    // Metadata
    ID = "example-mod"; // the id of the mod
    NAME = "Example Mod"; // human-readable name
    DESCRIPTION = "A example mod for CrackleSDK."; // description
    VERSION = "1.0"; // version
    AUTHOR = "Your Name"; // author
    DEPENDS = []; // dependencies (mod ids, useful for libraries)
    DO_MENU = true; // whether to add a menu item

    // Main function - gets ran when the mod is loaded
    main() {
        // allow access to the API in the menu functions and such, shortcut
        let api = this.api;

        // Example adding a menu item - see morphic.js's MenuMorph
        // for more info on menus
        this.menu.addItem("Say hello", () => {
            api.inform("Hello, world!", "Example Mod");
        });

        // Example of using events
        this.addEventListener('categoryCreating', (e) => {
            if (e.detail.name == "Hello") {
                api.inform("I dont accept your hello.", "Example Mod");

                e.preventDefault();
            }
        });

        // Example of menu hooking
        api.registerMenuHook("projectMenu", (menu) => {
            menu.addLine();
            menu.addItem("Example Mod - Say hello", () => {
                alert("hi");
            })
        });
    }

    // Cleanup function - get ran when the mod is "deleted"
    cleanupFunc() {
        console.log("Goodbye!");
    }
}
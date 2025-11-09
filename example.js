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
    },

    // Cleanup functions - get ran when the mod is "deleted"
    cleanupFuncs: [
        () => {
            console.log("Goodbye!");
        }
    ],
}
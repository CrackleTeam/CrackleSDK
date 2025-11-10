function attachEventHandlers(ide) {
    // projectCreating and projectCreated

    // this.backup tells the user about unsaved changes,
    // so we need to manually modify it here so the event
    // only gets called when backup actually calls the
    // callback
    ide.createNewProject = function () {
        this.backup(() => {
            if (triggerModEvent(new Event("projectCreating", { cancelable: true }))) {
                this.newProject();

                triggerModEvent(new Event("projectCreated"));
            }
        });
    };

    // categoryCreating and categoryCreated
    ide._addPaletteCategory = ide.addPaletteCategory;
    ide.addPaletteCategory = function (name, color) {
        if (triggerModEvent(new CustomEvent("categoryCreating", {
            cancelable: true,
            detail: { name, color }
        }))) {
            this._addPaletteCategory(name, color);

            triggerModEvent(new CustomEvent("categoryCreated", {
                detail: { name, color }
            }));
        }
    }
}
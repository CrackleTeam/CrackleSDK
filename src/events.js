function attachEventHandlers() {
    // projectCreating

    // this.backup tells the user about unsaved changes,
    // so we need to manually modify it here so the event
    // only gets called when backup actually calls the
    // callback
    IDE_Morph.prototype.createNewProject = function () {
        this.backup(() => {
            if (triggerModEvent(new Event("projectCreating", { cancelable: true }))) {
                this.newProject();
            }
        });
    };
}
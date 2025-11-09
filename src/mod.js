
function findModById(id) {
    return window.__crackle__.loadedMods.find(mod => mod.id == id);
}

class Mod extends EventTarget {
    constructor(code) {
        super();
        let returnValue = (new Function(code))();

        if (returnValue && typeof returnValue === "object") {
            this.id = returnValue.id || "unknown-mod";
            this.name = returnValue.name || "Unknown Mod";
            this.description = returnValue.description || "No description provided.";
            this.version = returnValue.version || "0.0";
            this.author = returnValue.author || "Anonymous";
            this.cleanupFuncs = returnValue.cleanupFuncs || [];
            this.depends = returnValue.depends || [];
            this.doMenu = returnValue.doMenu == undefined ? false : returnValue.doMenu;
            if (typeof returnValue.main === "function") {
                this.main = returnValue.main;
            } else {
                throw new Error("Mod must have a main() function.");
            }

            for (const dependency of this.depends) {
                if (!findModById(dependency)) {
                    throw new Error(`Mod depends on "${dependency}", but "${dependency}" is not loaded.`);
                }
            }

            if (this.doMenu) this.menu = new MenuMorph();
        }
    }
}

function showModInfo(id) {
    let mod = findModById(id);

    new DialogBoxMorph().inform(
        `Mod Information`,
        `Name: ${mod.name}\n` +
        `ID: ${mod.id}\n` +
        `Description: ${mod.description}\n` +
        `Version: ${mod.version}\n` +
        `Author: ${mod.author}`,
        world
    );
}

function deleteMod(id) {
    let mod = findModById(id);
    mod.cleanupFuncs.forEach(func => func());

    window.__crackle__.loadedMods = window.__crackle__.loadedMods.filter(mod => mod.id != id);
}

function triggerModEvent(event) {
    let ret = true;
    for (const mod of window.__crackle__.loadedMods) {
        ret = ret && mod.dispatchEvent(event);
        alert(ret);
    }

    return ret;
}
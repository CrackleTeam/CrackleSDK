/* 
    CrackleSDK - A modding framework for Snap!
    Copyright (C) 2025, developed by CrackleTeam

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// Get a currently LOADED mod by its ID
function findModById(id) {
  return window.__crackle__.loadedMods.find((mod) => mod.id == id);
}

// Convert mod ID to a human-readable name
// e.g., "my_mod-name" -> "My Mod Name"
function nameFromID(id) {
  return id.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// A Mod, loaded from code
class Mod extends EventTarget {
  constructor(code) {
    super(); // initialize EventTarget

    // execute the code in a new function scope
    let returnValue = new Function(code)();

    if (returnValue && typeof returnValue === "object") {
      // get metadata
      if (!returnValue.id) {
        throw new Error("Mod must have an ID.");
      }

      this.id = returnValue.id;
      this.name = returnValue.name || nameFromID(this.id);
      this.description = returnValue.description || "No description provided.";
      this.version = returnValue.version || "0.0";
      this.author = returnValue.author || "Anonymous";
      this.cleanupFuncs = returnValue.cleanupFuncs || [];
      this.depends = returnValue.depends || [];
      this.doMenu =
        returnValue.doMenu == undefined ? false : returnValue.doMenu;
      if (typeof returnValue.main === "function") {
        this.main = returnValue.main;
      } else {
        throw new Error("Mod must have a main() function.");
      }

      // check dependencies
      for (const dependency of this.depends) {
        if (!findModById(dependency)) {
          throw new Error(
            `Mod depends on "${dependency}", but "${dependency}" is not loaded.`,
          );
        }
      }

      // create menu if needed
      if (this.doMenu) this.menu = new MenuMorph();

      this.menuHooks = [];
    } else {
      throw new Error("Mod code must return an object.");
    }
  }
}

// Show mod information dialog
function showModInfo(id) {
  let mod = findModById(id);

  new DialogBoxMorph().inform(
    `Mod Information`,
    `Name: ${mod.name}\n` +
      `ID: ${mod.id}\n` +
      `Description: ${mod.description}\n` +
      `Version: ${mod.version}\n` +
      `Author: ${mod.author}`,
    world,
  );
}

// Delete a mod by its ID
function deleteMod(id) {
  let mod = findModById(id);
  mod.cleanupFuncs.forEach((func) => func());

  window.__crackle__.loadedMods = window.__crackle__.loadedMods.filter(
    (mod) => mod.id != id,
  );
  delete window.__crackle__.modCodes[id]
  if (!isNil(window.__crackle__.autoloadMods[id])) {
    deleteAutoloadMod(id)
  }
}

// Trigger an event on all loaded mods
function triggerModEvent(event) {
  let ret = true;
  for (const mod of window.__crackle__.loadedMods) {
    ret = ret && mod.dispatchEvent(event);
  }

  return ret;
}

// Manage loaded mods dialog
function manageLoadedMods() {
  const dlg = new DialogBoxMorph();
  dlg.key = "manageLoadedMods";
  dlg.labelString = "Manage Loaded Mods";
  dlg.createLabel();

  const list = new ScrollFrameMorph();
  list.setColor(new Color(20, 20, 20));
  list.setExtent(new Point(400, 200));

  const oddColor = new Color(20, 20, 20);
  const evenColor = new Color(40, 40, 40);
  let useOdd = false;

  function makeModMorph(mod) {
    const rowHeight = 25;

    const modMorph = new Morph();
    modMorph.setExtent(new Point(400, rowHeight));
    modMorph.setColor(useOdd ? oddColor : evenColor);

    const label = new TextMorph(`${mod.name} (${mod.id})`);
    label.setPosition(new Point(10, 5));
    label.setColor(new Color(240, 240, 240));
    modMorph.addChild(label);

    const infoButton = new PushButtonMorph(
      this,
      () => {
        showModInfo(mod.id);
      },
      "Info",
    );
    infoButton.setColor(new Color(100, 100, 250));
    infoButton.setPosition(new Point(label.right() + 5, 2));
    modMorph.addChild(infoButton);

    const autoloadButton = new PushButtonMorph(
      this,
      () => {
        if (isModAutoloaded(mod.id)) {
          deleteAutoloadMod(mod.id);
          world.children[0].showMessage(`${mod.name} will no longer run on startup again.`);
        } else {
          addAutoloadMod(mod.id);
          world.children[0].showMessage(`${mod.name} will now run every time you open Snap!`);
        }
        autoloadButton.labelString = isModAutoloaded(mod.id) ? "Un-autoload" : "Autoload";
        autoloadButton.createLabel();
        autoloadButton.fixLayout();
        modMorph.fixLayout();
      },
      isModAutoloaded(mod.id) ? "Un-autoload" : "Autoload",
    );
    autoloadButton.setColor(new Color(250, 250, 100));
    autoloadButton.setPosition(new Point(infoButton.right() + 5, 2));
    modMorph.addChild(autoloadButton);

    const deleteButton = new PushButtonMorph(
      this,
      () => {
        deleteMod(mod.id);
        dlg.destroy();
        manageLoadedMods(); // reopen with refreshed list
      },
      "Delete",
    );
    deleteButton.setColor(new Color(250, 100, 100));
    deleteButton.setPosition(new Point(autoloadButton.right() + 5, 2));
    modMorph.addChild(deleteButton);

    useOdd = !useOdd;
    modMorph.fixLayout = () => {
      infoButton.setLeft(label.right() + 5);
      autoloadButton.setLeft(infoButton.right() + 5);
      deleteButton.setLeft(autoloadButton.right() + 5);
    }
    return modMorph;
  }

  let index = 0;
  for (const mod of window.__crackle__.loadedMods) {
    const modMorph = makeModMorph(mod);
    modMorph.setPosition(new Point(0, index * modMorph.height()));
    list.addChild(modMorph);
    index++;
  }

  dlg.addBody(list);
  dlg.addButton("ok", "OK");
  dlg.fixLayout();
  dlg.popUp(world);
}

// Attach event handlers to the IDE for mod events
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
    if (
      triggerModEvent(
        new CustomEvent("categoryCreating", {
          cancelable: true,
          detail: { name, color },
        }),
      )
    ) {
      this._addPaletteCategory(name, color);

      triggerModEvent(
        new CustomEvent("categoryCreated", {
          detail: { name, color },
        }),
      );
    }
  };
}

// Create the API object passed to mods
function createApi(mod) {
  return {
    _mod: mod,
    ide: world.children[0],
    world: world,

    showMsg(msg) {
      this.ide.showMessage(msg);
    },

    addApi(name, obj) {
      window.__crackle__.extraApi[name] = obj;
      this[name] = obj;
    },

    inform(text, title) {
      this.ide.inform(title || "Information", text);
    },

    registerMenuHook(name, func) {
      mod.menuHooks.push({ name, func });
    },

    ...window.__crackle__.extraApi,
  };
}

// Wait until Snap! is fully loaded
function waitForSnapReady() {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (typeof world !== "undefined" && world.children.length > 0) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });
}

// attach hooks for menu hooks functions
function attachMenuHooks(ide) {
  function applyHooks(menu, name) {
    window.__crackle__.loadedMods.forEach((mod) => {
      mod.menuHooks.forEach((hook) => {
        if (hook.name == name) hook.func(menu);
      });
    });
  }

  // hook MenuMorph to call hooks for different menus
  MenuMorph.prototype._popup = MenuMorph.prototype.popup;
  MenuMorph.prototype.popup = function (world, pos) {
    if (this.target) {
      if (window.__crackle__.currentMenu)
        applyHooks(this, window.__crackle__.currentMenu);
    }

    return this._popup(world, pos);
  };

  // projectMenu
  IDE_Morph.prototype._projectMenu = IDE_Morph.prototype.projectMenu;
  IDE_Morph.prototype.projectMenu = function () {
    window.__crackle__.currentMenu = "projectMenu";
    this._projectMenu();
    window.__crackle__.currentMenu = null;
  };

  // settingsMenu
  IDE_Morph.prototype._settingsMenu = IDE_Morph.prototype.settingsMenu;
  IDE_Morph.prototype.settingsMenu = function () {
    window.__crackle__.currentMenu = "settingsMenu";
    this._settingsMenu();
    window.__crackle__.currentMenu = null;
  };

  // cloudMenu
  IDE_Morph.prototype._cloudMenu = IDE_Morph.prototype.cloudMenu;
  IDE_Morph.prototype.cloudMenu = function () {
    window.__crackle__.currentMenu = "cloudMenu";
    this._cloudMenu();
    window.__crackle__.currentMenu = null;
  };

  // snapMenu
  IDE_Morph.prototype._snapMenu = IDE_Morph.prototype.snapMenu;
  IDE_Morph.prototype.snapMenu = function () {
    window.__crackle__.currentMenu = "snapMenu";
    this._snapMenu();
    window.__crackle__.currentMenu = null;
  };

  // scriptsMenu
  ScriptsMorph.prototype._userMenu = ScriptsMorph.prototype.userMenu;
  ScriptsMorph.prototype.userMenu = function () {
    let menu = this._userMenu();
    applyHooks(menu, "scriptsMenu");
    return menu;
  };

  // paletteMenu
  //
  // NOTE: If a user opens a category before loading a mod
  // that uses paletteMenu, the hook will not take effect.
  //
  // TODO: Remove any palette cache on hooks of this
  // and refresh the current palette
  SpriteMorph.prototype._freshPalette = SpriteMorph.prototype.freshPalette;
  SpriteMorph.prototype.freshPalette = function (category) {
    let palette = this._freshPalette(category);

    palette._userMenu = palette.userMenu;
    palette.userMenu = function () {
      let menu = this._userMenu();
      applyHooks(menu, "paletteMenu");
      return menu;
    };

    return palette;
  };
}

function loadAutoloadMods() {
  const data = localStorage.getItem("crackle_autoload_mods");
  if (!data) localStorage.setItem("crackle_autoload_mods", "{}");

  return JSON.parse(data) || {};
}

function saveAutoloadMods() {
  localStorage.setItem("crackle_autoload_mods", JSON.stringify(window.__crackle__.autoloadMods));
}

function addAutoloadMod(id) {
  window.__crackle__.autoloadMods[id] = window.__crackle__.modCodes[id];
  saveAutoloadMods();
}

function deleteAutoloadMod(id) {
  delete window.__crackle__.autoloadMods[id];
  saveAutoloadMods();
}
function isModAutoloaded(id) {
  return !!window.__crackle__.autoloadMods[id];
  saveAutoloadMods();
}

async function autoloadMods(ide) {
  window.__crackle__.autoloadMods = loadAutoloadMods();

  for (const id of Object.keys(window.__crackle__.autoloadMods)) {
    var mod = window.__crackle__.autoloadMods[id]
    try {
        // TODO: optional fetching of mods
        window.__crackle__.loadMod(mod);
    } catch (e) {
      ide.showMessage("Failed to autoload mod, check console for more info");

      console.error("Failed to load mod: ", mod, e);
    }
  }
}

// Main function
async function main() {
  const BUTTON_OFFSET = 5; // pixels between buttons

  // wait for Snap! to be ready and get references
  await waitForSnapReady();
  const ide = world.children[0];
  const controlBar = ide.controlBar;

  // if __crackle__ already exists, reload the page (to avoid duplicates)
  if (window.__crackle__) {
    window.location.reload();
    return;
  }

  // create the __crackle__ object
  window.__crackle__ = {
    version: "1.0",
    source: "https://github.com/CrackleTeam/CrackleSDK/releases/latest",
    loadedMods: [],
    extraApi: {},
    autoloadMods: {},
    modCodes: {},

    // load a mod from code
    loadMod(code) {
      const mod = new Mod(code);

      this.loadedMods.forEach((element) => {
        if (element.id == mod.id) {
          ide.showMessage(
            "Mod already loaded, reloading it.. (deleting the current instance before loading it)",
          );
          deleteMod(mod.id);
        }
      });

      mod.main(createApi(mod));
      this.loadedMods.push(mod);
      this.modCodes[mod.id] = (code);

      return mod;
    },

    currentMenu: null,
  };

  // adjust the project label position to be after the mod button
  // this is needed because the fixLayout for the IDE doesnt know
  // about our new button, so it puts it after the normal place
  function adjustLabel(modButton) {
    controlBar.label.setPosition(
      new Point(
        controlBar.label.left() + BUTTON_OFFSET + modButton.width(),
        controlBar.label.top(),
      ),
    );
    controlBar.label.children[0].setPosition(controlBar.label.position());
  }

  // create mod button
  IDE_Morph.prototype.createModButton = function () {
    var controlBar = this.controlBar;
    if (controlBar.modButton) {
      controlBar.modButton.destroy();
    }
    var modButton = controlBar.settingsButton.fullCopy();
    controlBar.modButton = modButton;
    console.warn(controlBar.modButton);
    controlBar.addChild(modButton);

    // add functionality to mod button
    Object.assign(modButton, {
      about() {
        // logo from long base64 string - like Snap!, avoid external resources
        let logo = new Morph();
        logo.texture =
          "data:image/png;base64,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" +
          "rJUqilnQAAAAAElFTkSuQmCC";
        logo.setColor(CLEAR);

        // load the image to get its natural size, then set it to the logo morph
        let dlg = new DialogBoxMorph();
        const img = new Image();
        img.src = logo.texture;

        img.onload = function () {
          logo.setWidth(img.naturalWidth);
          logo.setHeight(img.naturalHeight);

          dlg.setPicture(logo);
          dlg.fixLayout();
        };

        // show the dialog. soon after the image will load and update
        // the dialog with it.
        dlg.inform(
          "About Crackle",
          `Crackle, a modding framework for Snap!\n` +
            `Developed by tethrarxitet and codingisfun2831t\n` +
            `Version ${window.__crackle__.version}\n`,
          world,
        );
      },
      download() {
        window.open(window.__crackle__.source, '_blank');
      },

      // dialog to load mod from code
      loadMod() {
        new DialogBoxMorph(
          this,
          (input) => {
            try {
              window.__crackle__.loadMod(input);
              ide.showMessage(`Mod $loaded successfully!`);
            } catch (e) {
              ide.showMessage(
                `Failed to load mod:\n${e}. Check the console for more details.`,
              );
              console.error(e);
            }
          },
          this,
        ).promptCode(
          "Load mod from code",
          "// Paste your mod code here",
          world,
        );
      },

      // load mod from file, uses file input
      loadModFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".js,text/javascript,application/javascript";
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              let mod = window.__crackle__.loadMod(e.target.result);
              ide.showMessage(`Mod "${mod.name}" loaded successfully!`);
            } catch (e) {
              ide.showMessage(`Failed to load mod:\n${e}`);
            }
          };
          reader.readAsText(file);
        };
        input.click();
      },

      // manage loaded mods dialog
      manageMods: manageLoadedMods,

      // action on click - show mod menu
      action() {
        const menu = new MenuMorph(modButton);
        menu.addItem("About Crackle...", "about");
        menu.addItem("Download Source...", "download");
        menu.addLine();
        menu.addItem("Load mod from code...", "loadMod");
        menu.addItem("Load mod from file...", "loadModFile");
        menu.addItem("Manage loaded mods...", "manageMods");

        let menus = {};
        for (let mod of window.__crackle__.loadedMods) {
          if (mod.doMenu) {
            menus[mod.name] = mod.menu;
          }
        }

        if (Object.keys(menus).length > 0) {
          menu.addLine();

          for (let [title, modMenu] of Object.entries(menus)) {
            menu.addMenu(title, modMenu);
          }
        }

        menu.popup(world, modButton.bottomLeft());
      },
    });

    // customize the button appearance
    modButton.children[0].name = "cross";
    controlBar.modButton = modButton;
    const originalUpdateLabel = controlBar.updateLabel;
    controlBar.updateLabel = function () {
      originalUpdateLabel.call(this);
      this.label.setPosition(
        new Point(
          this.label.left() + BUTTON_OFFSET + this.modButton.width(),
          this.label.top(),
        ),
      );
      this.label.children[0].setPosition(this.label.position());
    };
    controlBar.fixLayout_ = controlBar.fixLayout;
    controlBar.fixLayout = function () {
      this.fixLayout_()
      this.modButton.setPosition(
        new Point(
          this.settingsButton.right() + BUTTON_OFFSET,
          this.settingsButton.top(),
        ),
      );
    };
    adjustLabel(controlBar.modButton);
    controlBar.fixLayout();
  };
  // create mod button

  ide.createModButton();
  ide.createControlBar_ = ide.createControlBar;
  ide.createControlBar = function () {
    this.createControlBar_.call(this);
    this.createModButton();
  };

  // attach final things
  attachEventHandlers(ide);
  attachMenuHooks(ide);
  await autoloadMods(ide);
}

main();

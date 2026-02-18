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

  window.__crackle__.allEventTargets.forEach((element) => element.dispatchEvent(event))
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

    /*const autoloadButton = new PushButtonMorph(
      this,
      () => {
        if (isModAutoloaded(mod.id)) {
          deleteAutoloadMod(mod.id);
          saveAutoloadMods();
          world.children[0].showMessage(`${mod.name} will no longer run on startup again.`);
        } else {
          addAutoloadMod(mod.id);
          saveAutoloadMods();
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
    */

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
    deleteButton.setPosition(new Point(infoButton.right() + 5, 2));
    modMorph.addChild(deleteButton);

    useOdd = !useOdd;
    modMorph.fixLayout = () => {
      infoButton.setLeft(label.right() + 5);
     // autoloadButton.setLeft(infoButton.right() + 5);
      deleteButton.setLeft(infoButton.right() + 5);
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

    registerEventTarget(target) {
      window.__crackle__.allEventTargets.push(target);
    },

    sparkleEventTarget: new EventTarget(),

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
    source: "https://github.com/Mojavesoft-Group/sparkle/releases",
    loadedMods: [],
    extraApi: {},
    autoloadMods: {},
    modCodes: {},
    allEventTargets: [],

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
      addAutoloadMod(mod.id);
      console.log(window.__crackle__.autoloadMods)
      saveAutoloadMods();
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
    //console.warn(controlBar.modButton);
    controlBar.addChild(modButton);

    // add functionality to mod button
    Object.assign(modButton, {
      about() {
        // logo from long base64 string - like Snap!, avoid external resources

        // load the image to get its natural size, then set it to the logo morph
        let dlg = new DialogBoxMorph();

        // show the dialog. soon after the image will load and update
        // the dialog with it.
        dlg.inform(
          "About Sparkle",
          `Sparkle is a modding framework for Snap! and its forks.\n` +
            `Developed by tethrarxitet and codingisfun2831t with enhancements from PPPDUD.\n` +
            `Version ${window.__crackle__.version}.\n`,
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
              ide.showMessage(`Mod loaded successfully!`);
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
        menu.addItem("About Sparkle...", "about");
        menu.addItem("Download source...", "download");
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
      this.label.setExtent(
        new Point(
          this.steppingButton.left() - this.modButton.right() - 5 * 2,
          this.label.children[0].height()
        )
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
  IDE_Morph.prototype.toggleAppMode_ = IDE_Morph.prototype.toggleAppMode
  IDE_Morph.prototype.toggleAppMode = function (x) {
    this.toggleAppMode_(x);
    this.isAppMode ? this.controlBar.modButton.hide() : this.controlBar.modButton.show()
  }
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

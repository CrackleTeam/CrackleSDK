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

console.log("CrackleSDK is loading...");

function commaOr(...items) {
  if (items.length == 0) return "";
  if (items.length == 1) return items[0];
  if (items.length == 2) return items[0] + " or " + items[1];

  return items.slice(0, -1).join(", ") + " or " + items[items.length - 1];
}

// API for mods
class API {
  constructor(mod) {
    this.mod = mod;
    this.world = world;
    this.ide = world.children[0];
    this.snap = window.__crackle__.snap;
  }

  showMsg(msg) {
    this.ide.showMessage(msg);
  }

  addApi(name, obj) {
    API.prototype[name] = obj;
  }

  inform(text, title) {
    this.ide.inform(title || "Information", text);
  }

  wrapFunction(object, name, wrapper, overwrite) {
    var originalFunction = object[name];
    if (originalFunction[window.__crackle__.crackleSymbol]) {
      originalFunction[window.__crackle__.crackleSymbol].functions[
        this.mod.id
      ] = wrapper;
      return originalFunction;
    }

    const FUNCTION_ID = Symbol("Function ID");

    let proxy = new Proxy(originalFunction, {
      apply(target, ctx, args) {
        if (
          window.__crackle__.wrappedFunctions.get(FUNCTION_ID)?.overwrites
            ?.length == 0
        ) {
          Reflect.apply(target, ctx, args); // This calls the original function
        }
        // target is the original function (original object)
        // ctx is the ide object,
        // args is the arguments that were passed into the function

        // And then crackle will run all the functions that mods have defined

        let wrappers =
          window.__crackle__.wrappedFunctions.get(FUNCTION_ID)?.functions;
        if (wrappers) {
          for (let wrapper of Object.values(wrappers)) {
            wrapper.apply(ctx, args);
          }
        }
      },
      get(target, property, receiver) {
        if (property === window.__crackle__.crackleSymbol) {
          return window.__crackle__.wrappedFunctions.get(FUNCTION_ID);
        }
        return Reflect.get(target, property, receiver);
      },
    });
    var wrapData = {
      target: originalFunction,
      functions: {
        [this.mod.id]: wrapper,
      }
    }
    if (overwrite) {
      wrapData.overwrites = [this.mod.id];
    }
    window.__crackle__.wrappedFunctions.set(FUNCTION_ID, wrapData);

    object[name] = proxy;
  }

  registerMenuHook(name, func) {
    this.mod.menuHooks.push({ name, func });
  }

  requireSnaps(...names) {
    if (!names.includes(this.snap.snap)) {
      let msg = `Mod "${this.mod.name}" requires ${commaOr(...names)}, but you are using ${this.snap.snap}.`;
      this.inform(msg, "Incompatible Snap");
      throw new Error("snap not compatible");
    }
  }

  suggestSnaps(...names) {
    if (!names.includes(this.snap.snap)) {
      this.inform(`This mod is designed for ${commaOr(...names)}, but you are using ${this.snap.snap}.
      The mod might still work, continue at your own risk.`, "Snap Suggestion");
    }
  }

  disallowSnaps(...names) {
    if (names.includes(this.snap.snap)) {
      let msg = `Mod "${this.mod.name}" does not work with ${this.snap.snap}!`;
      this.inform(msg, "Incompatible Snap");
      throw new Error("snap not compatible");
    }
  }
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
      this.name =
        returnValue.name ||
        this.id.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
        if (!this.findModById(dependency)) {
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

    this.api = new API(this);
  }

  static findModById(id) {
    return window.__crackle__.loadedMods.find((mod) => mod.id == id);
  }

  static dispatchEvent(event) {
    let ret = true;
    for (const mod of window.__crackle__.loadedMods) {
      ret = ret && mod.dispatchEvent(event);
    }

    Object.values(window.__crackle__.allEventTargets).forEach((element) => element.dispatchEvent(event))

    return ret;
  }
}

// I import mods from CrackleTeam/CrackleMods
class CrackleImportLibraryMorph extends DialogBoxMorph {
  constructor(environment, action) {
    super(environment, action);
    this.path =
        "https://raw.githubusercontent.com/CrackleTeam/CrackleMods/refs/heads/master/";
      this.labelString = "Import Mod";
      this.key = "crackle import mods";
      fetch(this.path + "mods.json")
          .then((x) => x.json())
          .then(
            (list) => (
              (this.librariesList = list),
              this.buildContents(),
              this.popUp(world)
            ),
          );
  }

  fixListFieldItemColors() {
    // remember to always fixLayout() afterwards for the changes
    // to take effect
    this.mods.contents.children[0].alpha = 0;
    this.mods.contents.children[0].children.forEach((item) => {
      item.pressColor = this.titleBarColor.darker(20);
      item.color = new Color(0, 0, 0, 0);
      if (item.children[0]) {
        item.children[0].color = this.mods.color.b < 128 ? WHITE : BLACK;
      }
    });
  }

  buildContents() {
    this.container = new Morph();
    this.container.alpha = 0;
    this.mods = new ListMorph(
      this.librariesList,
      (element) =>
        element.name + (element.version ? ` (${element.version})` : ""),
      null,
      null,
      "~", // separator
      false, // verbatim
    );
    this.mods.action = (lib) => (
      (this.selected = lib),
      (this.notesText.text = lib.description),
      this.notesText.fixLayout(),
      this.notesText.rerender()
    );
    this.mods.setWidth(200);
    this.mods.setHeight(100);
    this.mods.setColor(new Color(237, 237, 237));
    this.fixListFieldItemColors();

    this.notesText = new TextMorph("");
    this.notesText.color = PushButtonMorph.prototype.labelColor;

    this.notesField = new ScrollFrameMorph();
    this.notesField.fixLayout = nop;
    this.notesField.acceptsDrops = false;
    this.notesField.contents.acceptsDrops = false;
    this.notesField.isTextLineWrapping = true;
    this.notesField.padding = 3;
    this.notesField.setContents(this.notesText);
    this.notesField.setHeight(100);
    this.notesField.setWidth(200);
    this.notesField.setLeft(this.mods.right() + 10);
    this.notesField.color = new Color(237, 237, 237);

    this.container.setWidth(this.mods.width() + 10 + this.notesField.width());
    this.container.setHeight(100);
    this.container.add(this.mods);
    this.container.add(this.notesField);

    this.createLabel();
    this.addBody(this.container);
    this.addButton(
      () =>
        fetch(this.path + "mods/" + this.selected.id + ".js")
          .then((x) => x.text())
          .then((mod) => (this.action(mod, this.selected.name), this.destroy())),
      "Import",
    );
    this.addButton("cancel", "Cancel");
    this.fixLayout();
  }
};

// Main function
async function main() {
  const BUTTON_OFFSET = 5; // pixels between buttons

  // wait for Snap! to be ready and get references
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
    IDE_Morph.prototype.projectMenu = new Proxy(
      IDE_Morph.prototype.projectMenu,
      {
        apply(target, ctx, args) {
          window.__crackle__.currentMenu = "projectMenu";
          Reflect.apply(...arguments); // This calls the original function
          window.__crackle__.currentMenu = null;
        },
      },
    );

    // settingsMenu
    IDE_Morph.prototype.settingsMenu = new Proxy(
      IDE_Morph.prototype.settingsMenu,
      {
        apply(target, ctx, args) {
          window.__crackle__.currentMenu = "settingsMenu";
          Reflect.apply(...arguments); // This calls the original function
          window.__crackle__.currentMenu = null;
        },
      },
    );

    // cloudMenu
    IDE_Morph.prototype.cloudMenu = new Proxy(
      IDE_Morph.prototype.cloudMenu,
      {
        apply(target, ctx, args) {
          window.__crackle__.currentMenu = "cloudMenu";
          Reflect.apply(...arguments); // This calls the original function
          window.__crackle__.currentMenu = null;
        },
      },
    );

    // snapMenu
    IDE_Morph.prototype.snapMenu = new Proxy(
      IDE_Morph.prototype.snapMenu,
      {
        apply(target, ctx, args) {
          window.__crackle__.currentMenu = "snapMenu";
          Reflect.apply(...arguments); // This calls the original function
          window.__crackle__.currentMenu = null;
        },
      },
    );

    // scriptsMenu
    ScriptsMorph.prototype.scriptsMenu = new Proxy(
      ScriptsMorph.prototype.scriptsMenu,
      {
        apply(target, ctx, args) {
          window.__crackle__.currentMenu = "scriptsMenu";
          Reflect.apply(...arguments); // This calls the original function
          window.__crackle__.currentMenu = null;
        },
      },
    );

    // paletteMenu
    //
    // NOTE: If a user opens a category before loading a mod
    // that uses paletteMenu, the hook will not take effect.
    //
    // TODO: Remove any palette cache on hooks of this
    // and refresh the current palette
    ScriptsMorph.prototype.freshPalette = new Proxy(
      ScriptsMorph.prototype.freshPalette,
      {
        apply(target, ctx, args) {
          window.__crackle__.currentMenu = "freshPalette";
          Reflect.apply(...arguments); // This calls the original function
          window.__crackle__.currentMenu = null;
        },
      },
    );

    SpriteMorph.prototype.freshPalette = new Proxy(
      SpriteMorph.prototype.freshPalette,
      {
        apply(target, ctx, args) {
          let palette = Reflect.apply(...arguments); // This calls the original function

          palette.userMenu = new Proxy(palette.userMenu, {
            apply(target, ctx, args) {
              let menu = Reflect.apply(...arguments);
              applyHooks(menu, "paletteMenu");
              return menu
            }  
          });

          return palette;
        },
      },
    );
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
        if (
          Mod.dispatchEvent(new Event("projectCreating", { cancelable: true }))
        ) {
          this.newProject();

          Mod.dispatchEvent(new Event("projectCreated"));
        }
      });
    };

    // categoryCreating and categoryCreated
    IDE_Morph.prototype.addPaletteCategory = new Proxy(
      IDE_Morph.prototype.addPaletteCategory,
      {
        apply(target, ctx, args) {
          if (
        Mod.dispatchEvent(
          new CustomEvent("categoryCreating", {
            cancelable: true,
            detail: { name: args[0], color: args[1] },
          }),
        )
      ) {
        Reflect.apply(...arguments); // This calls the original function

        Mod.dispatchEvent(
          new CustomEvent("categoryCreated", {
            detail: { name: args[0], color: args[1] },
          }),
        );
      }
        },
      },
    );
  }
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
    version: "0.2",
    source: "https://github.com/CrackleTeam/CrackleSDK/releases/latest",
    loadedMods: [],
    extraApi: {},
    autoloadMods: {},
    modCodes: {},
    allEventTargets: {},
    crackleSymbol: Symbol("Crackle Data"),
    wrappedFunctions: new Map(),
    snap: (function() {
      // Split?
      if (typeof SplitVersion !== "undefined") {
        return {
          snap: "Split",
          version: SplitVersion
        };
      }

      // default to Snap
      return {
        snap: "Snap",
        version: SnapVersion
      }
    })(),

    // load a mod from code
    loadMod(code, autoload) {
      const mod = new Mod(code);

      if (this.loadedMods.some((element) => element.id == mod.id)) {
        ide.showMessage(
          "Mod already loaded, reloading it.. (deleting the current instance before loading it)",
        );
        this.deleteMod(mod.id);
      }

      this.loadedMods.push(mod);
      this.modCodes[mod.id] = code;
      if (window.__crackle__.doAutoload || autoload) {
        this.autoload.add(mod.id);
      }
      mod.main();

      return mod;
    },

    // Delete a mod by its ID
    deleteMod(id) {
      let mod = Mod.findModById(id);
      mod.cleanupFuncs.forEach((func) => func());

      window.__crackle__.loadedMods = window.__crackle__.loadedMods.filter(
        (mod) => mod.id != id,
      );

      // remove wraps
      window.__crackle__.wrappedFunctions.forEach((value, key) => {
        if (value.functions[id]) {
          delete value.functions[id];
          value.overwrites = value.overwrites.filter((modId) => modId != id);
          if (Object.keys(value).length == 0) {
            window.__crackle__.wrappedFunctions.delete(key);
          }
        }
      });
      delete window.__crackle__.allEventTargets[id];
      // remove autoload
      delete this.modCodes[id];
      if (!isNil(this.autoloadMods[id])) {
        this.autoload.delete(id);
      }
    },

    autoload: {
      load() {
        let data = localStorage.getItem("crackle_autoload_mods");
        if (!data || data == "[]")
          (localStorage.setItem("crackle_autoload_mods", "{}"), (data = {}));

        return JSON.parse(data) || {};
      },

      save() {
        localStorage.setItem(
          "crackle_autoload_mods",
          JSON.stringify(window.__crackle__.autoloadMods),
        );
      },

      add(id) {
        window.__crackle__.autoloadMods[id] = window.__crackle__.modCodes[id];
        this.save();
      },

      delete(id) {
        delete window.__crackle__.autoloadMods[id];
        this.save();
      },
      isAutoloaded(id) {
        return !!window.__crackle__.autoloadMods[id];
      },

      loadAuto: async function (ide) {
        window.__crackle__.autoloadMods = this.load();

        for (const id of Object.keys(window.__crackle__.autoloadMods)) {
          var mod = window.__crackle__.autoloadMods[id];
          try {
            // TODO: optional fetching of mods
            window.__crackle__.loadMod(mod, true);
          } catch (e) {
            ide.showMessage(
              "Failed to autoload mod, check console for more info",
            );

            console.error("Failed to load mod: ", mod, e);
          }
        }
      },
    },
    doAutoload: true,
    toggleAutoload() {
      window.__crackle__.doAutoload = !window.__crackle__.doAutoload;
      this.saveSettings();
    },
    loadSettings() {
      var settings = JSON.parse(localStorage.getItem("crackle_settings") || "{}");
      this.doAutoload = settings.doAutoload !== false;
    },
    saveSettings() {
      localStorage.setItem("crackle_settings", JSON.stringify({
        doAutoload: window.__crackle__.doAutoload
      }));
    },

    currentMenu: null,
  };
  window.__crackle__.loadSettings();

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
    var modButton;
    if (controlBar.modButton) {
      controlBar.modButton.destroy();
    }

    if (window.__crackle__.snap.snap == "Split" || window.__crackle__.snap.snap) {
      var modButton = controlBar.settingsButton.fullCopy();
      controlBar.modButton = modButton;
      console.warn(controlBar.modButton);
      controlBar.addChild(modButton);
    }
    

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
            `Developed by tethrarxitet, codingisfun2831t and d016\n` +
            `Version ${window.__crackle__.version}\n`,
          world,
        );
      },
      settings() {
        var dlg = new DialogBoxMorph(),
        body = new AlignmentMorph('column', 5);

        var autoload = new ToggleMorph(
            'checkbox',
            dlg,
            () => window.__crackle__.toggleAutoload(), // action,
            "Automatically Autoload Mods", // label
            () => window.__crackle__.doAutoload //query
        );
        body.add(autoload);
        body.fixLayout();

        dlg.key = "settings";
        dlg.labelString = "Crackle Settings";
        dlg.createLabel();
        dlg.addBody(body);
        dlg.addButton('ok', 'OK');
        dlg.fixLayout();
        dlg.popUp(world);
      },
      download() {
        window.open(window.__crackle__.source, "_blank");
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
      manageLoadedMods() {
        const dlg = new DialogBoxMorph();
        dlg.key = "manageLoadedMods";
        dlg.labelString = "Manage Loaded Mods";
        dlg.createLabel();

        const list = new ScrollFrameMorph();
        list.setColor(new Color(20, 20, 20));
        list.setExtent(new Point(400, 200));
        list.acceptsDrops = false;
        list.contents.acceptsDrops = false;
        const oddColor = new Color(20, 20, 20);
        const evenColor = new Color(40, 40, 40);
        let useOdd = false;

        function makeModMorph(mod) {
          // Show mod information dialog
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
              new DialogBoxMorph().inform(
                `Mod Information`,
                `Name: ${mod.name}\n` +
                  `ID: ${mod.id}\n` +
                  `Description: ${mod.description}\n` +
                  `Version: ${mod.version}\n` +
                  `Author: ${mod.author}`,
                world,
              );
            },
            "Info",
          );
          infoButton.setColor(new Color(100, 100, 250));
          infoButton.setPosition(new Point(label.right() + 5, 2));
          modMorph.addChild(infoButton);

          const autoloadButton = new PushButtonMorph(
            this,
            () => {
              if (window.__crackle__.autoload.isAutoloaded(mod.id)) {
                window.__crackle__.autoload.delete(mod.id);
                world.children[0].showMessage(
                  `${mod.name} will no longer run on startup again.`,
                );
              } else {
                window.__crackle__.autoload.add(mod.id);
                world.children[0].showMessage(
                  `${mod.name} will now run every time you open Snap!`,
                );
              }
              autoloadButton.labelString =
                window.__crackle__.autoload.isAutoloaded(mod.id)
                  ? "Un-autoload"
                  : "Autoload";
              autoloadButton.createLabel();
              autoloadButton.fixLayout();
              modMorph.fixLayout();
            },
            window.__crackle__.autoload.isAutoloaded(mod.id)
              ? "Un-autoload"
              : "Autoload",
          );
          autoloadButton.setColor(new Color(250, 250, 100));
          autoloadButton.setPosition(new Point(infoButton.right() + 5, 2));
          modMorph.addChild(autoloadButton);

          const deleteButton = new PushButtonMorph(
            this,
            () => {
              window.__crackle__.deleteMod(mod.id);
              dlg.destroy();
             modButton.manageLoadedMods(); // reopen with refreshed list
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
          };
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
      },

      // action on click - show mod menu
      action() {
        const menu = new MenuMorph(modButton);
        menu.addItem("About Crackle...", "about");
        menu.addItem("Crackle Settings...", "settings");
        menu.addItem("Download Source...", "download");
        menu.addLine();
        menu.addItem("Download mods...", () => {
          new CrackleImportLibraryMorph(this, (code, name) => {
            window.__crackle__.loadMod(code);
            world.children[0].showMessage(`${name} Loaded`);
          });
        }); // not yet... we need MODS.json
        menu.addItem("Load mod from code...", "loadMod");
        menu.addItem("Load mod from file...", "loadModFile");
        menu.addItem("Manage loaded mods...", "manageLoadedMods");

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
    
    if (window.__crackle__.snap.snap === "Split") {
      modButton.children[1].text = "Mods";
      modButton.children[1].fixLayout();
      modButton.children[2].setLeft(modButton.children[1].right() + 5);
      modButton.setWidth(30 + modButton.children.reduce((sum, child) => sum + child.width(), 0));
    }

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

      if (window.__crackle__.snap.snap !== "Split") {
        this.label.setExtent(
          new Point(
            this.steppingButton.left() - this.modButton.right() - 5 * 2,
            this.label.children[0].height(),
          ),
        );

        this.label.children[0].setPosition(this.label.position());
      }
    };
    controlBar.fixLayout = new Proxy(
      controlBar.fixLayout,
      {
        apply(target, ctx, args) {
            Reflect.apply(...arguments);
            let btn = window.__crackle__.snap.snap == "Split" ? ctx.editButton : ctx.settingsButton;
            ctx.modButton.setPosition(
            new Point(
            btn.right() + BUTTON_OFFSET,
            btn.top(),
          ),
        );
        },
      },
    );
    adjustLabel(controlBar.modButton);
    controlBar.fixLayout();
  };
  IDE_Morph.prototype.toggleAppMode = new Proxy(
      IDE_Morph.prototype.toggleAppMode,
      {
        apply(target, ctx, args) {
          Reflect.apply(...arguments);
          ctx.isAppMode
            ? ctx.controlBar.modButton.hide()
            : ctx.controlBar.modButton.show();
        },
      },
    );
  // create mod button
  
  ide.createModButton();
  ide.createControlBar = new Proxy(
      ide.createControlBar,
      {
        apply(target, ctx, args) {
          Reflect.apply(...arguments);
          ctx.createModButton();
        },
      },
    );

  // attach final things
  attachEventHandlers(ide);
  attachMenuHooks(ide);
  await window.__crackle__.autoload.loadAuto(ide);
}

main();
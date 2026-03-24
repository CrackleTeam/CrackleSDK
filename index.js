"use strict";
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
        this.mod.ID
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
        [this.mod.ID]: wrapper,
      }
    }
    if (overwrite) {
      wrapData.overwrites = [this.mod.ID];
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
  static ID = "unknown-mod";
  static NAME = "Unknown Mod";
  static DESCRIPTION = "No description avaiable.";
  static VERSION = "1.0";
  static AUTHOR = "John Doe";
  static DEPENDS = [];
  static DO_MENU = false;

  constructor() {
    super(); // initialize EventTarget

    this.api = new API(this);
    this.menuHooks = [];
  }

  static findModById(id) {
    return window.__crackle__.loadedMods.find((mod) => mod.ID == id);
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

class CrackleMorph extends ScrollFrameMorph {
  constructor(crackle, vertical) {
    super();
    this.crackle = crackle;
    this.vertical = vertical || false;
    this.type = "import";
    this.myPadding = DialogBoxMorph.prototype.padding;
  }

  setupLibraries(list) {
    this.type = "import";
    this.librariesList = list || [];
    this.buildContents();
    this.fixLayout();
  }
  setupManager(reopen) {
    this.type = "manage";
    this.reopen = reopen;
    this.buildContents();
    this.fixLayout();
  }
  setupSettings() {
    this.type = "settings";
    this.buildContents();
    this.fixLayout();
  }
  fixListFieldItemColors() {
    // remember to always fixLayout() afterwards for the changes
    // to take effect
    this.mods.contents.children[0].alpha = 0;
    this.mods.contents.children[0].children.forEach((item) => {
      item.pressColor = DialogBoxMorph.prototype.titleBarColor.darker(20);
      item.color = new Color(0, 0, 0, 0);
      if (item.children[0]) {
        item.children[0].color = this.mods.color.b < 128 ? WHITE : BLACK;
      }
    });
  }
  buildLibrary() {
    if (this.mods) {
      this.mods.destroy();
    }
    if (this.notesField) {
      this.notesField.destroy();
    }

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
      (this.notesText.text = lib.description + (lib.author ? ("\n\n" + "made by " + lib.author) : "") ),
      this.notesText.fixLayout(),
      this.notesText.rerender()
    );
    this.mods.setColor(new Color(237, 237, 237));
    this.notesText = new TextMorph("");
    this.notesText.color = PushButtonMorph.prototype.labelColor;
    this.notesField = new ScrollFrameMorph();
    this.notesField.fixLayout = nop;
    this.notesField.acceptsDrops = false;
    this.notesField.contents.acceptsDrops = false;
    this.notesField.isTextLineWrapping = true;
    this.notesField.padding = 3;
    this.notesField.setContents(this.notesText);
    this.fixListFieldItemColors();
    this.notesField.color = new Color(237, 237, 237);

    this.addContents(this.mods);
    this.addContents(this.notesField);
  }
  buildManager() {
    const myself = this;
    this.setColor(new Color(20, 20, 20));
    if (!this.vertical) {
      this.setExtent(new Point(400, 200));
    }
    this.acceptsDrops = false;
    this.contents.acceptsDrops = false;
    const oddColor = new Color(20, 20, 20);
    const evenColor = new Color(40, 40, 40);
    let useOdd = false;

    function makeModMorph(mod) {
      const crackle = myself.crackle;
      // Show mod information dialog
      const rowHeight = 25;

      const modMorph = new Morph();
      modMorph.setExtent(new Point(400, rowHeight));
      modMorph.setColor(useOdd ? oddColor : evenColor);

      const labelFrame = new FrameMorph();
      console.log(mod);
      const label = new TextMorph(`${mod.NAME} (${mod.ID})`);
      label.setPosition(new Point(10, 5));
      label.setColor(new Color(240, 240, 240));
      labelFrame.setExtent(modMorph.extent())
      labelFrame.add(label);
      labelFrame.alpha = 0;
      labelFrame.color = CLEAR;
      modMorph.addChild(labelFrame);

      const infoButton = new PushButtonMorph(
        this,
        () => {
          new DialogBoxMorph().inform(
            `Mod Information`,
            `Name: ${mod.NAME}\n` +
              `ID: ${mod.ID}\n` +
              `Description: ${mod.DESCRIPTION}\n` +
              `Version: ${mod.VERSION}\n` +
              `Author: ${mod.AUTHOR}`,
            world,
          );
        },
        "Info",
      );
      
      infoButton.setColor(new Color(100, 100, 250));
      modMorph.addChild(infoButton);
      modMorph.infoButton = infoButton;

      const autoloadButton = new PushButtonMorph(
        this,
        () => {
          if (crackle.autoload.isAutoloaded(mod.ID)) {
            crackle.autoload.delete(mod.ID);
            world.children[0].showMessage(
              `${mod.name} will no longer run on startup again.`,
            );
          } else {
            crackle.autoload.add(mod.ID);
            world.children[0].showMessage(
              `${mod.name} will now run every time you open ${crackle.snap.snap}!`,
            );
          }
          autoloadButton.labelString = crackle.autoload.isAutoloaded(mod.ID)
            ? "Un-autoload"
            : "Autoload";
          autoloadButton.createLabel();
          autoloadButton.fixLayout();
          modMorph.fixLayout();
        },
        crackle.autoload.isAutoloaded(mod.ID) ? "Un-autoload" : "Autoload",
      );
      autoloadButton.setColor(new Color(250, 250, 100));
      if (crackle.isDev) {
        modMorph.addChild(autoloadButton);
      }
      modMorph.autoloadButton = autoloadButton;

      const deleteButton = new PushButtonMorph(
        this,
        () => {
          crackle.deleteMod(mod.ID);
          myself.reopen(); // reopen with refreshed list
        },
        "Delete",
      );
      deleteButton.setColor(new Color(250, 100, 100));
      deleteButton.setTop(2);
      deleteButton.setRight(modMorph.right() - 5);
      autoloadButton.setTop(2);
      autoloadButton.setRight(deleteButton.left() - 5);
      infoButton.setTop(2);
      infoButton.setRight(
        (crackle.isDev ? autoloadButton : deleteButton).left() - 5,
      );
      modMorph.deleteButton = deleteButton;
      modMorph.addChild(deleteButton);

      useOdd = !useOdd;
      modMorph.fixLayout = function () {
        this.deleteButton.setTop(this.top() + 2);
        this.deleteButton.setRight(this.right() - 2);
        this.autoloadButton.setTop(this.top() + 2);
        this.autoloadButton.setRight(this.deleteButton.left() - 3);
        this.infoButton.setTop(this.top() + 2);
        this.infoButton.setRight(
          (crackle.isDev ? this.autoloadButton : this.deleteButton).left() - 3,
        );
        labelFrame.setPosition(this.position());
        labelFrame.bounds.corner.x = this.infoButton.left() - 3;
        labelFrame.bounds.corner.y = this.bottom();
        labelFrame.fixLayout(true);
        label.rerender();
      };
      modMorph.step = () => modMorph.bounds.setWidth(myself.width());
      modMorph.fixLayout();

      // jens... plz fix...
      MorphicPreferences.isFlat && (infoButton.label.shadowColor = null);
      MorphicPreferences.isFlat && (autoloadButton.label.shadowColor = null);
      MorphicPreferences.isFlat && (deleteButton.label.shadowColor = null);
      return modMorph;
    }

    let index = 0;
    for (const mod of this.crackle.loadedMods) {
      const modMorph = makeModMorph(mod);
      modMorph.setPosition(new Point(0, index * modMorph.height()));
      this.addContents(modMorph);
      index++;
    }
  }
  fixManageLayout() {
    this.contents.children.forEach(child => child.fixLayout());
  }
  buildSettings() {
    if (this.settings) {
      this.settings.destroy();
    }
    this.settings = new AlignmentMorph("column", 5);
    var autoload = new ToggleMorph(
      "checkbox",
      null,
      () => this.crackle.toggleDev(), // action,
      "Developer Mode", // label
      () => this.crackle.isDev, //query
    );
    this.settings.add(autoload);
    this.settings.fixLayout();

    this.alpha = 0;
    if (!this.vertical) {
      this.setWidth(Math.min(this.settings.width(), 200));
      this.setHeight(Math.min(this.settings.height(), 150));
    }
    this.addContents(this.settings);
  }
  buildContents() {
    switch (this.type) {
      case "import":
        this.buildLibrary();
        break;
      case "manage":
        this.buildManager();
        break;
      case "settings":
        this.buildSettings();
        break;
    }
  }
  fixLibrariesLayout() {
    if (this.vertical) {
      this.mods.setWidth(this.width() - this.myPadding);
      this.mods.setHeight(this.height() / 2 - this.myPadding);
      this.mods.setTop(this.top());
      this.mods.setLeft(this.left());

      this.notesField.setWidth(this.width());
      this.notesField.setHeight(this.height() / 2 - this.myPadding);
      this.notesField.setTop(this.mods.bottom() + this.myPadding);
      this.notesField.setLeft(this.left());
    } else {
      this.mods.setWidth(200);
      this.mods.setHeight(100);

      this.notesField.setHeight(100);
      this.notesField.setWidth(200);
      this.notesField.setLeft(this.mods.right() + 10);

      this.setWidth(this.mods.width() + 10 + this.notesField.width());
      this.setHeight(100);
    }
  }
  fixLayout() {
    ScrollFrameMorph.prototype.fixLayout.call(this);
    this.contents.adjustBounds();
    switch (this.type) {
      case "import":
        this.fixLibrariesLayout();
        break;
      case "manage":
        this.fixManageLayout();
        break;
    }
  }
}

// I import mods from CrackleTeam/CrackleMods
class CrackleImportLibraryMorph extends DialogBoxMorph {
  constructor(environment, action) {
    super(environment, action);
    this.container = new CrackleMorph(window.__crackle__, false);
    this.tab = "import"; // for vertical
    this.path =
      "https://raw.githubusercontent.com/CrackleTeam/CrackleMods/refs/heads/master/";
    this.labelString = "Import Mod";
    this.key = "crackle import mods";
    fetch(this.path + "mods.json")
      .then((x) => x.json())
      .then(
        (list) => (
          (this.librariesList = list),
          this.container.setupLibraries(list),
          this.buildContents(),
          this.popUp(world),
          this.container.fixLayout()
        ),
      );
  }
  buildContents() {
    this.container.type == "import" && (this.container.alpha = 0);

    this.createLabel();

    this.addBody(this.container);
    if (this.buttons.children.length == 0) {
      this.addButton(
        () =>
          fetch(this.path + "mods/" + this.container.selected.id + ".js")
            .then((x) => x.text())
            .then(
              (mod) => (
                this.action(mod, this.container.selected.name),
                this.vertical || this.destroy()
              ),
            ),
        "Import",
      );
      this.addButton("cancel", "Cancel");
    }
    this.fixLayout();
  }
}

class VerticalCrackleDialogMorph extends CrackleImportLibraryMorph {
  constructor(environment, action) {
    super(environment, action);
    this.corner = 0;
    this.tab = "import";
    this.container.vertical = true;
    this.vertical = true;
  }
  reactToWorldResize(rect) {
    this.changed();
    this.bounds = rect;
    this.rerender();
    this.fixLayout();
  }
  switchTab(tab) {
    this.changed();
    this.container = new CrackleMorph(window.__crackle__, true);
    this.container.type = this.tab || "import";
    this.tab = tab;
    switch (tab) {
      case "import":
        this.container.setupLibraries(this.librariesList || []);
        break;
      case "manage":
        this.container.setupManager(() => this.container.setupManager());
        break;
      case "settings":
        this.container.setupSettings();
        break;
    }
    this.buildContents();
    this.fixContainerLayout();
    this.fixLayout();
  }
  buildTabs() {
    if (this.tabs) {
      this.tabs.destroy();
    }

    function setTab(tab) {
      tab.getPressRenderColor = function () {
        return this.pressColor;
      };
      tab.corner = 10;
      tab.padding = 3;
      tab.edge = 1;
      tab.labelShadowOffset = new Point(-1, -1);
      tab.fontSize = 10;
      tab.labelColor = WHITE;
      tab.labelShadowColor = BLACK;
      tab.labelShadowOffset = new Point(1, 1);
      tab.fixLayout();
    } 

    var tab,
      colors = [
        PushButtonMorph.prototype.color.darker(), 
        PushButtonMorph.prototype.highlightColor.darker(), 
        PushButtonMorph.prototype.pressColor.darker()
      ];
    this.tabs = new AlignmentMorph("row", -15, "center");
    this.tabs.alignment = "center";
    tab = new TabMorph(
      colors,
      null,
      () => {
        this.switchTab("import")
      },
      "Explore",
      () => this.tab == "import",
    );
    setTab(tab);
    this.tabs.add(tab);
    tab = new TabMorph(
      colors,
      null,
      () => {
        this.switchTab("manage")
      },
      "Manage",
      () => this.tab == "manage",
    );
    setTab(tab);
    this.tabs.add(tab);
    tab = new TabMorph(
      colors,
      null,
      () => {
        this.switchTab("settings")
      },
      "Settings",
      () => this.tab == "settings",
    );
    setTab(tab);
    this.tabs.add(tab);
    this.addHead(this.tabs);
  }
  buildContents() {
    CrackleImportLibraryMorph.prototype.buildContents.call(this);
    this.buildTabs();
    this.buttons.children[1]?.destroy?.();
  }
  fixContainerLayout() {
    this.container.setExtent(this.extent());
    this.container.bounds.corner.x = this.right() - this.padding;
    this.container.bounds.corner.y = this.buttons.top() - this.padding;
    this.container.fixLayout();
    this.container.contents.adjustBounds();
  }
  popUp(world) {
    CrackleImportLibraryMorph.prototype.popUp.call(this, world);
    this.setPosition(new Point(0, 0));
    this.setWidth(world.width());
    this.setHeight(world.height());
    this.fixLayout();
    this.fixContainerLayout();
    this.fixLayout();
    // this.isDraggable = false;
  }
  fixLayout() {
    // determine by extent and arrange my components
    var th = fontHeight(this.titleFontSize) + this.titlePadding * 2,
      w,
      stack = isNil(this.stackPadding) ? this.padding : this.stackPadding;

    if (this.head) {
      this.head.setPosition(
        this.position().add(new Point(this.padding, th + this.padding)),
      );
      this.head.setWidth(this.right() - this.head.left() - this.padding);
    }

    if (this.body) {
      this.body.setPosition(
        (this.head
          ? this.head.bottomLeft().subtract(new Point(0, this.padding * 2))
          : this.position()
        ).add(new Point(this.padding, th + stack)),
      );
      this.body.fixLayout();
    }

    if (this.label) {
      this.label.setCenter(this.center());
      this.label.setTop(this.top() + (th - this.label.height()) / 2);
    }

    if (this.buttons && this.buttons.children.length > 0) {
      this.buttons.fixLayout();
      /*this.bounds.setHeight(
            this.height()
                + this.buttons.height()
                + this.padding
        );*/
      this.bounds.setWidth(
        Math.max(this.width(), this.buttons.width() + 2 * this.padding),
      );
      this.buttons.setCenter(this.center());
      this.buttons.setBottom(this.bottom() - this.padding);
    }

    // refresh a shallow shadow
    this.removeShadow();
    this.addShadow();
  }
}


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
  ScriptsMorph.prototype.userMenu = new Proxy(
    ScriptsMorph.prototype.userMenu,
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
(async function () {

  console.log("CrackleSDK is loading...");

  const BUTTON_OFFSET = 5; // pixels between buttons
  await waitForSnapReady();
  const ide = world.children[0];
  const controlBar = ide.controlBar;

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
    snap: (function () {
      // Jameson?
      if (
        (window.location.hostname + window.location.pathname) ==
        "mojavesoft.net/ide/snap" || (window.location.hostname + window.location.pathname) ==
        "mojavesoft.org/ide/snap"
      ) {
        return {
          snap: "Jameson",
          version: window.SnapVersion,
        };
      }

      // Snavanced
      if (window.SnavancedVersion) {
        return {
          snap: "Snavanced",
          version: window.SnavancedVersion,
        };
      }

      // Split?
      if (typeof window.SplitVersion !== "undefined") {
        return {
          snap: "Split",
          version: window.SplitVersion
        };
      }

      // default to Snap
      return {
        snap: "Snap",
        version: window.SnapVersion
      }
    })(),

    // load a mod from code, TEMPORARY. use addMod for loading normal mods from the menu or download.
    loadMod(code) {
      let mod = Function(code)();
      if (!(mod.prototype instanceof Mod)) {
        // support old object mods
        let newMod = new Mod();

        if (mod.id) newMod.ID = mod.id;
        if (mod.name) newMod.NAME = mod.name;
        if (mod.description) newMod.DESCRIPTION = mod.description;
        if (mod.author) newMod.AUTHOR = mod.author;
        if (mod.version) newMod.VERSION = mod.version;
        if (mod.depends) newMod.DEPENDS = mod.depends;
        if (mod.doMenu) newMod.DO_MENU = mod.doMenu;

        if (mod.main) newMod.main = mod.main;
        if (mod.cleanupFunc) newMod.cleanupFunc = mod.cleanupFunc;

        mod = newMod;
      } else mod = new mod();

      if (this.loadedMods.some((element) => element.ID == mod.ID)) {
        ide.showMessage(
          "Mod already loaded, reloading it.. (deleting the current instance before loading it)",
        );
        this.deleteMod(mod.ID);
      }

      this.loadedMods.push(mod);
      this.modCodes[mod.ID] = code;
      if (mod.DO_MENU) mod.menu = new MenuMorph();
      mod.main();

      return mod;
    },

    // load a mod and save it across runs
    addMod(code) {
      const mod = this.loadMod(code);
      this.autoload.add(mod.ID);
      return mod;
    },

    // Delete a mod by its ID
    deleteMod(id) {
      let mod = Mod.findModById(id);
      if (mod.cleanupFunc) mod.cleanupFunc();

      window.__crackle__.loadedMods = window.__crackle__.loadedMods.filter(
        (mod) => mod.ID != id,
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
        let data = window.__crackle__.storage.get("crackle_autoload_mods");
        if (!data || data == "[]")
          (window.__crackle__.storage.set("crackle_autoload_mods", "{}"), (data = {}));

        return JSON.parse(data) || {};
      },

      save() {
        window.__crackle__.storage.set(
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
    isDev: false,
    toggleDev() {
      window.__crackle__.isDev = !window.__crackle__.isDev;
      this.saveSettings();
    },
    loadSettings() {
      var settings = JSON.parse(this.storage.get("crackle_settings") || "{}");
      this.isDev = settings.isDev !== false;
    },
    saveSettings() {
      this.storage.set(
        "crackle_settings",
        JSON.stringify({
          isDev: window.__crackle__.isDev,
        }),
      );
    },

    storage: {
      set(key, value) {
        localStorage.setItem(key, value);
      },
      get(key) {
        return localStorage.getItem(key);
      },
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

        body = new CrackleMorph(window.__crackle__, false);
        body.setupSettings();

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
      loadMod(temporary = false) {
        new DialogBoxMorph(
          this,
          (input) => {
            let mod;

            try {
              if (temporary) {
                mod = window.__crackle__.loadMod(input);
              } else {
                mod = window.__crackle__.addMod(input);
              }
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
      loadModFile(temporary = false) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".js,text/javascript,application/javascript";
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            let mod;
            try {
              if (temporary) {
                mod = window.__crackle__.loadMod(e.target.result);
              } else {
                mod = window.__crackle__.addMod(e.target.result);
              }
              ide.showMessage(`Mod "${mod.NAME}" loaded successfully!`);
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

        const list = new CrackleMorph(window.__crackle__, false);
        list.setupManager(() => (dlg.destroy(), this.manageLoadedMods()));
        dlg.addBody(list);
        dlg.addButton("ok", "OK");
        dlg.fixLayout();
        dlg.popUp(world);
      },

      // action on click - show mod menu
      action() {
        const menu = new MenuMorph(modButton);
        const world = this.world();
        menu.addItem("About Crackle...", "about");
        menu.addItem("Crackle Settings...", "settings");
        menu.addItem("Download Source...", "download");
        menu.addLine();
        menu.addItem(
          "Download mods...",
          () => {
            new CrackleImportLibraryMorph(this, (code, name) => {
              window.__crackle__.addMod(code, true);
              new MenuMorph(null, `${name} Loaded`).popUpCenteredInWorld(
                this.world(),
              );
            });
          },
          null,
          null,
          true,
        );
        menu.addItem("Load mod from file...", "loadModFile");
        if (window.__crackle__.isDev || world.currentKey === 16) { // shift
          menu.addLine();
          menu.addItem("Load temporary mod from code...", () => modButton.loadMod(true),
            "load a temporary mod from code" + (window.__crackle__.isDev ? "" : ", mainly for development"), new Color(100, 0, 0));
          menu.addItem("Load temporary mod from file...", () => modButton.loadModFile(true),
            "load a temporary mod from file" + (window.__crackle__.isDev ? "" : ", mainly for development"), new Color(100, 0, 0));
        }
        menu.addLine();
        menu.addItem("Manage loaded mods...", "manageLoadedMods");

        let menus = {};
        for (let mod of window.__crackle__.loadedMods) {
          if (mod.DO_MENU) {
            menus[mod.NAME] = mod.menu;
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
})();
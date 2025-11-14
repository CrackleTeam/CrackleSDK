/*
    events.js - file for CrackleSDK events
    
    CrackleSDK - A modding framework for Snap!
    Copyright (C) 2025 CrackleSDK Team

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
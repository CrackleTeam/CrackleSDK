/*
    api.js - file for CrackleSDK APIs
    
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

function createApi(id) {
    return {
        _id: id,
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

        ...window.__crackle__.extraApi
    }
}
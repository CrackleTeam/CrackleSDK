/*
    modManager.js - contains UI to manage installed mods
    
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

        const infoButton = new PushButtonMorph(this, () => {
            showModInfo(mod.id);
        }, "Info");
        infoButton.setColor(new Color(100, 100, 250));
        infoButton.setPosition(new Point(label.right() + 5, 2));
        modMorph.addChild(infoButton);

        const deleteButton = new PushButtonMorph(this, () => {
            deleteMod(mod.id);
            dlg.destroy();
            manageLoadedMods(); // reopen with refreshed list
        }, "Delete");
        deleteButton.setColor(new Color(250, 100, 100));
        deleteButton.setPosition(new Point(infoButton.right() + 5, 2));
        modMorph.addChild(deleteButton);

        useOdd = !useOdd;
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

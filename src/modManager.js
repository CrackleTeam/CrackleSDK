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

/*
    index.js - main JS file for CrackleSDK
    
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

// Waits for the Snap! environment to be fully loaded
function waitForSnapReady() {
    return new Promise(resolve => {
        const check = setInterval(() => {
            if (typeof world !== "undefined" && world.children.length > 0) {
                clearInterval(check);
                resolve();
            }
        }, 100);
    });
}

async function main() {
    const BUTTON_OFFSET = 5;


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
        loadedMods: [],
        extraApi: {},

        loadMod(code) {
            const mod = new Mod(code);

            this.loadedMods.forEach(element => {
                if (element.id == mod.id) {
                    ide.showMessage("Mod already loaded, reloading it.. (deleting the current instance before loading it)");
                    deleteMod(mod.id);
                }
            });

            mod.main(createApi(mod.id));
            this.loadedMods.push(mod);

            return mod;
        }
    };

    function adjustLabel() {
        controlBar.label.setPosition(
            new Point(
                controlBar.label.left() + BUTTON_OFFSET + modButton.width(),
                controlBar.label.top()
            )
        );
        controlBar.label.children[0].setPosition(controlBar.label.position());
    }

    // create mod button
    const settingsButtonIndex = controlBar.children.findIndex(
        child => child instanceof PushButtonMorph && child.action === "settingsMenu"
    );

    const modButton = controlBar.children[settingsButtonIndex].fullCopy();
    controlBar.addChild(modButton);

    Object.assign(modButton, {
        about() {
            let logo = new Morph();
            logo.texture = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUUAAABTCAMAAAA/UuVdAA" + 
                "AAM1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACjB" + 
                "UbJAAAAEHRSTlMADx8vP09fb3+Pn6+/z9/v+t8hjgAAB39JREFUeNrs2NuS2yAMgGHJYAzipPd/2k6T" + 
                "zTZBIONtp3Z29r+NMzBfsMGBYWg3T+kzvy7w07FsyCyqaTNw/fg5DzN5fir9K8LKo4qFq3cJRZdZja6" + 
                "+Hi+giIl3I4Qrd76iqzxRWeHCna2IkSfzcN1OVjSVpwtw2c5VXCsfiOCqnaro+N7b39RnKlo+2lW3mB" + 
                "MVTeWjlYseeM5TxMKP3n6HOU8xcqdCm73nQlf5mm+DpyluLKNXI0MsOjre91ZcKrdFhDaT3mMxnqVI3" + 
                "BYQOsW3WIwnKS7cVA10w8xNBo70rRVJIg7C8gbb9DmKWDVE/Wxe4cstzn+0WjiS9T6mj6Lflv+hiKun" + 
                "9Mg7s//qtwHYP8FrQbzAhPRUgEfmhkTig3uOCj+XHDxKzzlBn7it0HpQMaTXjK7oKHNbdAgvNZdkAOC" + 
                "mtI0WboDUmYEjbR9aiDv5fQRL3K94XVFfNgSKIlJhkdyBl86GwaJk+4uxdBRRP1quhbtF3EEIrLQpiv" + 
                "rLbkZF0RYeVrfhiTveJyJLSxd9EYqYWVFE4lF50RBsYTU/pSinVxcYKmJktYyDQ6AbKXK18gGQglDEz" + 
                "IoiZnVSYwTPe9GcYguzwlDRVu4nr63NHfo7TX57oMbtxtoqkjacqayVRghIvB/NKG5iCQ8V3fyYpncA" + 
                "5H7h8YVMboFbQnFhRREr6/k+AmaeadtXNGJeUlFHlCby2lVTZHsb0iI8koqkKO5jVOwiRJ7L6IryZyw" + 
                "4VFx5rrXzvAFVkaCpVcy2KoqBdws9hMCT5T3FJNhHiqbyXBXFz5x1RcaRokwqWj6cF6tCz+mKQVw+VM" + 
                "w8mxcIaUfR/41i+poiVp6uqIqruLWGip7bCvlbVDuLsYhBNcUyrVhSbqZmWVS2+zMWbShDRc9t0Vm4Z" + 
                "ULl16yiuIjj9lixNlLBwGemgXQArCnK1n3FSusC0KilzoXRwlNr7irKpRiNcvwjoagdt4eKm9iElD9l" + 
                "0oRiSe0QumI2vaGS/DvIQVPoKf5q58x2HIWBKOoNYxsv9f9fO9LMaAJ9qwqcZNJqifPWCwSOt4tVwSS" + 
                "IM9o2wJAtFugQssXBdFp5brDnFqsZ6vpSpRYOegQKBkicRdj+0Pc8g2Qxwqlli6smEY8IvMW0I5oCXU" + 
                "Gx6I1gscPyiBS0uDCJSRteq2DRDziRbLExt6QEz4QWkU47um6xGMFiwE0PxHawWGA9BNpuHY0OLLJn7" + 
                "lax6KD36w2eBYtKPvCqRS9ZTGCDI4DFgdfHPxq3vChbaxvEbcXiQnvcaVlTFSxqq6Bq0TxwaUfczm3g" + 
                "2Sj5C/Id1RSsur+4QtxWLB5/7IFlnbPomJCpPEdLdLV9pTUgRZgHJDSLAeK2arHSBKJFfeGMT1mUwrv" + 
                "eZinhR89btBC3P26xwzHPWLSX+hQktbThbDZvEeO2bpHebnEhwD1hMUgfo0+MCWfdeYsZ4vbHLW4E5J" + 
                "9lEfrB+nGLjpDxoyz6QfTdIzoRQ/wui27eom0EtE9b7OxRn1ld0GKYt1iIIX3WYiAW/2LSaUbCqkknT" + 
                "VtsxOJVi4eDRj0ln1gsxFJeTd3WCCyqxTZhUaVdz4vDnKNbtMQz7LTFqsRnudlSoOmJka6QNIsZrvUl" + 
                "iysJxGmLSXh40SNBsjAI3mORvGJxnR4AQ9sF6iTQpi0u0AwcBbpMu1hJ7iYtditb9JAvJVACWggk4mc" + 
                "tWshsrGqwmOHmWQIVsKiTZYtmYFmsTlFGWiGRMmvRbLAjAPiBFj3hcUjc/YUEOh0JkkW48S5o9FKstm" + 
                "L3aR3WlymLkc4uLQ5uEWh0ZCzYz8teMPEMt0G3lix6LJdjyBSFm1vEtSUef1xnLdqBRZR7bCaAfQymb" + 
                "AX7zSsWF7iCIlrE3YMCHkMlGp6f+7Ic8RyM/QmLfLnBo7Td5a5Ub8j3ZGPuX2YwOdosIFay6Ako0Tzw" + 
                "qR9XWdxpYP2Wr2MrzFq0g5BefzOIJ4l1R409cHjBYuXm5mFZi+KSUNMfGva6KkWQ8rXd4lGraFEPOzq" + 
                "jYn5daYJoxFyDDbmJFm0nBexMWUiCOIAtHXDXLYJwkWTAIhynMqwYzOQxjRZNuPx57IlXdhrLOCDSrE" + 
                "Uc04hFi3rHQF+ERClvDSdZNJEUsD93nFrw1x6F92mL5w2cDVrEqRHR58UCdQOvViRjt8tsrg11z1/hW" + 
                "90TJi2eX9mwvEXjG12hwxoNQT2AA7Q4qdFCwTioUNEtzmsECUkom9O+d3TyDdsMYxosTr0bp3th0i/v" + 
                "t4gRGRlqcXuCA4UUr5dc4pgGi1NvXducOFs1+y6LiKtyo2oWja/X3iHH7jpoYxos7lgHabSgJZAR3mY" + 
                "RiZWQnu35tylzFx3Czph0RbgQePXblOtGEjWevDeCSnibRcQV/tkYLWILDGzy4s0OJs7pY7qBxSOuNA" + 
                "J6XbFOhQH+7a2E8k9/3YK5jg1pe2joW3Lm/+NjrjvteXWGoRFLy/c7fSfwg26e57FTcPO6RbPSzesWT" + 
                "aGbZznEqJvXLZpIN89xr9TvAF41ffME5guh0800Blgq3UxiGMJ2z49zGBaX6i1yAmXrZN3usX2RX4xi" + 
                "rJUqilnQAAAAAElFTkSuQmCC";
            logo.setColor(CLEAR);

            let dlg = new DialogBoxMorph();
            const img = new Image();
            img.src = logo.texture;

            img.onload = function() {
                logo.setWidth(img.naturalWidth);
                logo.setHeight(img.naturalHeight);

                dlg.setPicture(logo);
                dlg.fixLayout();
            };

            dlg.inform(
                "About Crackle",
                `Crackle, a modding framework for Snap!\n` +
                `Developed by tethrarxitet and codingisfun2831t\n` +
                `Version ${window.__crackle__.version}`,
                world
            );
        },
        loadMod() {
            new DialogBoxMorph(
                this,
                (input) => {
                    try {
                        window.__crackle__.loadMod(input);
                        ide.showMessage(`Mod $loaded successfully!`);
                    } catch (e) {
                        ide.showMessage(`Failed to load mod:\n${e}. Check the console for more details.`);
                        console.error(e);
                    }
                },
                this
            ).promptCode(
                "Load mod from code",
                "// Paste your mod code here",
                world
            );
        },
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

        manageMods: manageLoadedMods,

        action() {
            const menu = new MenuMorph(modButton);
            menu.addItem("About Crackle...", "about");
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
        }
    });

    modButton.children[0].name = "cross";

    modButton.setPosition(new Point(
        controlBar.children[settingsButtonIndex].right() + BUTTON_OFFSET,
        controlBar.children[settingsButtonIndex].top()
    ));

    adjustLabel();

    // label updates
    const originalUpdateLabel = controlBar.updateLabel;
    controlBar.updateLabel = function () {
        originalUpdateLabel.call(this);
        adjustLabel();
    };

    attachEventHandlers(ide);
}

main();
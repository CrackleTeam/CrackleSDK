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
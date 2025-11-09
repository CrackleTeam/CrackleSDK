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
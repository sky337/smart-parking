const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {

    const win = new BrowserWindow({

        width: 1200,
        height: 800,

        minWidth: 800,
        minHeight: 600,

        resizable: true,

        maximizable: true,

        title: "Inventory Management",

        autoHideMenuBar: true,

        icon: path.join(__dirname, "assets/icon.png"),

        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }

    });

    win.loadFile("index.html");

}
openAbout();

app.whenReady().then(createWindow);

win.on("maximize", () => {

    console.log("Window Maximized");

});

win.on("minimize", () => {

    console.log("Window Minimized");

});

win.on("close", () => {

    console.log("Closing");

});

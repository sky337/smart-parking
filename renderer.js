function openAbout() {

    const about = new BrowserWindow({

        width: 500,
        height: 350,
        title: "About"

    });

    about.loadFile("about.html");
    win.loadURL("https://www.google.com");

}

document.getElementById("btn").addEventListener("click", () => {
    document.getElementById("msg").innerText = "Electron is Awesome!";
});
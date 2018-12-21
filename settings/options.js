function saveOptions(e) {
    browser.storage.local.set({
        args: document.querySelector("#args").value
    });
    browser.storage.local.set({
        mainClose: document.querySelector("#mainClose").checked
    });
    restoreOptions;
}

function restoreOptions() {
    function setArgs(result) {
        document.querySelector("#args").value = result.args || "--pause --ytdl-format='bestvideo[height<=?1080]+bestaudio/best'";
  }
    function setMainClose(result) {
        document.querySelector("#mainClose").checked = result.mainClose;
    }

    var getting = browser.storage.local.get("args");
    getting.then(setArgs);
    var getting = browser.storage.local.get("mainClose");
    getting.then(setMainClose);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

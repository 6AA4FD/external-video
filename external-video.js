var targetPages = [
    "*://*.youtube.com/watch?*",
    "*://*.twitch.tv/*",
    "*://*.vimeo.com/*",
    "*://*.streamable.com/*",
    "*://*.liveleak.com/view*",
    // "*://*.vid.me/*", // vidme is suspended
    // "*://*.funnyordie.com/*", // youtube-dl returns unsupported for these
    "*://*.dailymotion.com/video/*"
];

var settings = {};
var tabsLock = [];

function openOriginal(info, tab) {
    function onCreated(tab) {
        tabsLock.push(tab.id);
        browser.tabs.update(tab.id, {
            url: info.linkUrl
        });
    }

    var creating = browser.tabs.create({});
    creating.then(onCreated);
}

function restoreSettings() {
  function setSettings(data) {
    settings = data;
  }

    var getting = browser.storage.local.get();
    getting.then(setSettings);
}

function openInMpv(request) {
    console.log("mainClose:", settings.mainClose);
    if (!(request.type == "main_frame")) {
        console.log("ignoring a background request");
            return { cancel: false };
        }

    var lockedTabIndex = tabsLock.lastIndexOf(request.tabId);

    if (!(lockedTabIndex == -1)) {
        console.log("tab has been set to ignore")
        return { cancel: false };
    }

    console.log("new candidate:", request.url, "type is:", request.type);

    function closeTab(data) {
        if (settings.mainClose) {
            browser.tabs.remove(data.id);
        }
        if (!data.active) {
            browser.tabs.remove(data.id);
        }
    }

    function mpvRun(data) {
        var command = `${data.url} --force-window=immediate`;
        console.log("running mpv", command);
        browser.runtime.sendNativeMessage("mpv", command);

        browser.history.addUrl({
            url: data.url
        });

        var querying = browser.tabs.get(data.tabId);
        querying.then(closeTab);
    }

    if (request.url == "https://www.twitch.tv/") {
        console.log("this url is not a twitch stream");
        return { cancel: false };
    }

    if (request.url.includes("twitch.tv/directory")) {
        console.log("this candidate is not a twitch stream");
        return { cancel: false };
    }

    console.log("running the supported url");
    mpvRun(request);
    return { cancel: true };
}

chrome.contextMenus.create({
  id: "open_original",
  title: "Open without MPV",
  onclick: openOriginal,
  contexts: ["link"]
});

browser.storage.onChanged.addListener(restoreSettings);
browser.webRequest.onBeforeRequest.addListener(openInMpv, { urls: targetPages }, ["blocking"]);

restoreSettings();

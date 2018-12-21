var targetPages = [
  "*://*.youtube.com/watch?*",
  "*://*.twitch.tv/*",
  "*://*.vimeo.com/*",
  "*://*.streamable.com/*",
  "*://*.liveleak.com/view*",
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
  if (!(request.type == "main_frame")) {
    return { cancel: false };
  }

  var lockedTabIndex = tabsLock.lastIndexOf(request.tabId);

  if (!(lockedTabIndex == -1)) {
    return { cancel: false };
  }

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
    browser.runtime.sendNativeMessage("mpv", command);

    browser.history.addUrl({
      url: data.url
    });

    var querying = browser.tabs.get(data.tabId);
    querying.then(closeTab);
  }

  if (request.url == "https://www.twitch.tv/") {
    return { cancel: false };
  }

  if (request.url.includes("twitch.tv/directory")) {
    return { cancel: false };
  }

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

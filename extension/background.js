import getDefaultOptions from "./utils/default_options.js";
import {
    getFromStorage,
    removeFromStorage,
    saveToStorage,
} from "./utils/handle_storage.js";

let windowInfo = {};

chrome.action.onClicked.addListener((_) => {
    chrome.windows.getAll({ populate: true }).then((windows) => {
        const options_page_url = `chrome-extension://${chrome.runtime.id}/options.html`;
        let options_page_exists = false;
        for (const window of windows) {
            if (!window.focused) {
                continue;
            }
            const options_tab = window.tabs.find(
                (tab) => tab.url === options_page_url
            );
            if (options_tab) {
                chrome.tabs.update(options_tab.id, { selected: true });
                options_page_exists = true;
                break;
            }
        }
        if (!options_page_exists) {
            chrome.tabs.create({ url: "options.html" });
        }
    });
});

chrome.runtime.onInstalled.addListener(async () => {
    const options = (await getFromStorage()).options;
    console.log(options);

    if (!options) {
        chrome.tabs.create({ url: "options.html" });
        return;
    }

    const defaultOptions = getDefaultOptions();
    const mergedOptions = {
        ...defaultOptions,
        ...options,
    };
    const mergedOptionsKeys = Object.keys(mergedOptions);
    const newOptions = mergedOptionsKeys.reduce((obj, key) => {
        if (Object.hasOwn(defaultOptions, key)) {
            obj[key] = mergedOptions[key];
        }
        return obj;
    }, {});

    removeFromStorage(["options"]);
    saveToStorage({ options: newOptions });
});

const connect = (tabId) => {
    const hostName = "translation_toggler";
    const port = chrome.runtime.connectNative(hostName);

    port.postMessage(windowInfo);

    port.onDisconnect.addListener(() => {
        console.log(chrome.runtime.lastError.message);
        windowInfo = {};
        chrome.tabs.sendMessage(tabId, "");
    });
};

const getFullscreenState = (windows) => {
    let isFullscreen = false;
    for (const window of windows) {
        if (window.focused && window.state.includes("fullscreen")) {
            isFullscreen = true;
            break;
        }
    }
    return isFullscreen;
};

chrome.runtime.onMessage.addListener((obj, sender) => {
    windowInfo = {};
    chrome.windows.getAll().then((windows) => {
        const isFullscreen = getFullscreenState(windows);
        windowInfo = {
            ...obj,
            isFullscreen,
        };
        connect(sender.tab.id);
    });
});

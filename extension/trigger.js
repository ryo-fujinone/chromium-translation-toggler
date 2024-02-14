const origTitle = document.title;
let clientX = 0;
let clientY = 0;
let translationCount = 0;

let getFromStorage;
let getDefaultOptions;

const createTriggerElement = (triggerID) => {
    const elem = document.createElement("div");
    elem.style.display = "none";
    elem.setAttribute("id", triggerID);
    elem.dataset.trigger = false;
    document.body.append(elem);
    return elem;
};

const trigger = (elem, options) => {
    const randomStr = Math.random().toString(36).substring(2);
    document.title = origTitle + randomStr;
    translationCount++;

    if (elem.dataset.x && !isNaN(elem.dataset.x)) {
        clientX = parseInt(elem.dataset.x);
    }
    if (elem.dataset.y && !isNaN(elem.dataset.y)) {
        clientY = parseInt(elem.dataset.y);
    }

    document.activeElement.blur();
    chrome.runtime.sendMessage({
        title: document.title,
        mode: options.howToOpen,
        barHeight: options.barHeight,
        autoGetBarHeight: options.autoGetBarHeight,
        clientX,
        clientY,
        translationCount,
    });

    chrome.runtime.onMessage.addListener(() => {
        document.title = origTitle;
        elem.dataset.trigger = false;
        elem.dataset.x = "";
        elem.dataset.y = "";
    });
};

const main = async () => {
    const options = (await getFromStorage()).options || getDefaultOptions();
    const elem = createTriggerElement(options.triggerID);

    if (options.howToOpen === "right-click") {
        document.addEventListener("mousemove", (e) => {
            clientX = e.clientX;
            clientY = e.clientY;
        });
    }

    new MutationObserver((_) => {
        if (elem.dataset.trigger === "true") {
            trigger(elem, options);
        }
    }).observe(elem, { attributes: true });
};

(async () => {
    const handleStorageStc = chrome.runtime.getURL("utils/handle_storage.js");
    const handleStorageModule = await import(handleStorageStc);
    getFromStorage = handleStorageModule.getFromStorage;

    const defaultOptionsSrc = chrome.runtime.getURL("utils/default_options.js");
    const defaultOptionsModule = await import(defaultOptionsSrc);
    getDefaultOptions = defaultOptionsModule.default;
    await main();
})();

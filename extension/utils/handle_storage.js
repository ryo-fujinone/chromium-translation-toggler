import getDefaultOptions from "./default_options.js";

const getFromStorage = (keys = null) => {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => {
            resolve(result);
        });
    });
};

const removeFromStorage = (keys = []) => {
    chrome.storage.local.remove(keys);
};

const saveToStorage = (obj = {}) => {
    return chrome.storage.local.set(obj);
};

const clearStorage = () => {
    chrome.storage.local.clear();
};

const createOptionsProxy = async () => {
    let options = (await getFromStorage()).options;
    if (!options) {
        options = getDefaultOptions();
        saveToStorage({ options: options });
    }

    let canSave = true;
    return new Proxy(options, {
        set(target, prop, value, receiver) {
            canSave = true;
            Reflect.set(target, prop, value, receiver);

            Promise.resolve().then(() => {
                if (canSave) {
                    canSave = false;
                    console.log(target);
                    saveToStorage({ options: target });
                }
            });

            return true;
        },
    });
};

const resetOptionsProxy = (optionsPxy) => {
    Object.keys(optionsPxy).forEach((key) => delete optionsPxy[key]);
    removeFromStorage(["options"]);
    const defaultOptions = getDefaultOptions();
    Object.keys(defaultOptions).forEach(
        (key) => (optionsPxy[key] = defaultOptions[key])
    );
    return optionsPxy;
};

export {
    clearStorage,
    createOptionsProxy,
    getFromStorage,
    removeFromStorage,
    resetOptionsProxy,
    saveToStorage,
};

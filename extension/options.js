import getDefaultOptions from "./utils/default_options.js";
import {
    createOptionsProxy,
    resetOptionsProxy,
} from "./utils/handle_storage.js";

const manifestData = chrome.runtime.getManifest();

const setMessages = () => {
    const i18nElems = document.querySelectorAll("[data-i18n]");
    for (const elem of i18nElems) {
        const key = elem.dataset.i18n;
        const message = chrome.i18n.getMessage(key);
        if (message) {
            elem.insertAdjacentHTML(
                "afterbegin",
                message.replace(/(\n)/g, "<br>")
            );
        } else {
            elem.insertAdjacentHTML("afterbegin", key);
        }
    }
};

const setFooter = () => {
    const versionElem = document.querySelector("footer .ext-ver");
    versionElem.append("v" + manifestData.version);
};

class OptionsPage {
    static options = getDefaultOptions();

    static changeTriggerIdCheckBox =
        document.querySelector("#change-trigger-id");
    static triggerIdTextBox = document.querySelector("#trigger-id");

    static typeKeysRadioBtn = document.querySelector("#type-keys");
    static rightClickRadioBtn = document.querySelector("#right-click");
    static edgeModeRadioBtn = document.querySelector("#edge-mode");

    static getBarHeightBtn = document.querySelector("#get-bar-height");
    static setBarHeightCheckBox = document.querySelector("#set-bar-height");
    static barHeightTextBox = document.querySelector("#bar-height");
    static autoGetBarHeightCheckBox = document.querySelector(
        "#auto-get-bar-height"
    );

    static resetBtn = document.querySelector("#reset-btn");

    static resetOptions() {
        const defaultOptions = getDefaultOptions();

        this.changeTriggerIdCheckBox.checked = false;
        this.triggerIdTextBox.value = defaultOptions.triggerID;
        this.triggerIdTextBox.disabled = true;

        if (/Edg\//.test(window.navigator.userAgent)) {
            this.edgeModeRadioBtn.checked = true;
        } else {
            this.typeKeysRadioBtn.checked = true;
        }

        this.setBarHeightCheckBox.checked = false;
        this.barHeightTextBox.value = defaultOptions.barHeight;
        this.barHeightTextBox.disabled = true;
        this.autoGetBarHeightCheckBox.checked = false;

        this.options = resetOptionsProxy(this.options);
    }

    static restoreOptions() {
        const defaultOptions = getDefaultOptions();

        if (this.options.triggerID !== defaultOptions.triggerID) {
            this.changeTriggerIdCheckBox.checked = true;
            this.triggerIdTextBox.value = this.options.triggerID;
            this.triggerIdTextBox.disabled = false;
        }

        switch (this.options.howToOpen) {
            case "type-keys":
                this.typeKeysRadioBtn.checked = true;
                break;
            case "right-click":
                this.rightClickRadioBtn.checked = true;
                break;
            case "edge-mode":
                this.edgeModeRadioBtn.checked = true;
                break;
            default:
                break;
        }

        if (this.options.setBarHeight) {
            this.setBarHeightCheckBox.checked = true;
            this.barHeightTextBox.disabled = false;
        }

        this.barHeightTextBox.value = this.options.barHeight;
        this.autoGetBarHeightCheckBox.checked = this.options.autoGetBarHeight;
    }

    static shouldSetEventListeners = true;

    static setEventListener() {
        if (!this.shouldSetEventListeners) {
            return;
        }
        this.shouldSetEventListeners = true;

        this.changeTriggerIdCheckBox.addEventListener("change", (e) => {
            this.triggerIdTextBox.disabled = !e.target.checked;
        });

        this.triggerIdTextBox.addEventListener("input", (e) => {
            this.options.triggerID = e.target.value;
        });

        this.typeKeysRadioBtn.addEventListener("change", (e) => {
            this.options.howToOpen = "type-keys";
        });
        this.rightClickRadioBtn.addEventListener("change", (e) => {
            this.options.howToOpen = "right-click";
        });
        this.edgeModeRadioBtn.addEventListener("change", (e) => {
            this.options.howToOpen = "edge-mode";
        });

        this.setBarHeightCheckBox.addEventListener("change", (e) => {
            this.options.setBarHeight = e.target.checked;
            this.barHeightTextBox.disabled = !e.target.checked;
        });

        this.barHeightTextBox.addEventListener("input", (e) => {
            if (isNaN(e.target.value)) {
                this.barHeightTextBox.value = this.options.barHeight;
                return;
            }
            this.options.barHeight = parseInt(e.target.value);
        });

        this.autoGetBarHeightCheckBox.addEventListener("change", (e) => {
            this.options.autoGetBarHeight = e.target.checked;
        });

        this.getBarHeightBtn.addEventListener("click", (e) => {
            const origTitle = document.title;
            const randomStr = Math.random().toString(36).substring(2);
            document.title = origTitle + randomStr;
            let isFinished = false;

            const hostName = "translation_toggler";
            const port = chrome.runtime.connectNative(hostName);

            port.postMessage({ mode: "get_bar_height", title: document.title });

            port.onMessage.addListener((message) => {
                const barHeight = message?.barHeight;
                if (typeof barHeight === "number") {
                    this.options.barHeight = barHeight;
                    this.barHeightTextBox.value = barHeight;
                    isFinished = true;
                    alert(
                        `${chrome.i18n.getMessage(
                            "optionBarHeight"
                        )}: ${barHeight}px`
                    );
                }
            });

            port.onDisconnect.addListener(() => {
                console.log(chrome.runtime.lastError.message);
                document.title = origTitle;
                if (!isFinished) {
                    alert(chrome.i18n.getMessage("failedToGetBarHeight"));
                }
            });
        });

        this.resetBtn.addEventListener("click", this.resetOptions.bind(this));
    }
}

const browserCheck = (optionsPxy) => {
    if (!optionsPxy.firstTime) {
        return;
    }
    optionsPxy.firstTime = false;
    if (/Edg\//.test(window.navigator.userAgent)) {
        optionsPxy.howToOpen = "edge-mode";
    }
};

window.onload = async () => {
    setMessages();
    setFooter();

    const optionsPxy = await createOptionsProxy();
    console.log(optionsPxy);
    browserCheck(optionsPxy);
    OptionsPage.options = optionsPxy;
    OptionsPage.restoreOptions();
    OptionsPage.setEventListener();

    document.body.style.visibility = "visible";
};

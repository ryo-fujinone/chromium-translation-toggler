#!/usr/bin/python3

import json
import struct
import sys

import pygetwindow
import pywinauto

if sys.platform == "win32":
    import msvcrt
    import os

    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)


def read_stdin():
    text_length_bytes = sys.stdin.buffer.read(4)
    text_length = struct.unpack("@I", text_length_bytes)[0]
    text = sys.stdin.buffer.read(text_length).decode("utf-8")
    return text


def send_message(message):
    json_str = json.dumps(message, separators=(",", ":"))
    sys.stdout.buffer.write(struct.pack("I", len(json_str)))
    sys.stdout.write(json_str)
    sys.stdout.flush()


def get_handle(title):
    windows = pygetwindow.getWindowsWithTitle(title)
    if len(windows) == 0:
        sys.exit(1)
    return windows[0]._hWnd


def get_bar_height(title):
    handle = get_handle(title)
    app = pywinauto.application.Application(backend="uia").connect(
        handle=handle
    )
    window = app.window(handle=handle)

    bar_height_list = [
        d.rectangle().height()
        for d in reversed(window.descendants()[-200:])
        if (
            d.friendly_class_name() == "TabControl"
            or d.friendly_class_name() == "Toolbar"
        )
    ]
    bar_height_list = [h for h in bar_height_list if h > 0]
    if len(bar_height_list) >= 3:
        bar_height_list = bar_height_list[:3]

    bar_height = sum(bar_height_list)
    send_message({"barHeight": bar_height})
    return bar_height


def toggler1(json_data):
    handle = get_handle(json_data["title"])
    app = pywinauto.application.Application(backend="uia").connect(
        handle=handle
    )
    window = app.window(handle=handle)

    if window.children()[0].friendly_class_name() == "Pane":
        # If the translation menu is open.
        # focus on translation menu
        window.type_keys("{F6}")
        # Toggle translation
        pywinauto.keyboard.send_keys("{ENTER}")
        # Close translation menu
        pywinauto.keyboard.send_keys("{ESC}")
    else:
        devtools_is_active = "DevTools" in window.children()[1].texts()[0]
        is_fullscreen = json_data["isFullscreen"]

        if is_fullscreen and devtools_is_active:
            # Close devtools
            pywinauto.keyboard.send_keys("{F12}")

        # Focus on page
        pywinauto.keyboard.send_keys("^{F6}")
        # Open context menu
        pywinauto.keyboard.send_keys("+{F10}")
        # Toggle translation
        pywinauto.keyboard.send_keys("t{ENTER}")
        # Close translation menu
        pywinauto.keyboard.send_keys("{ESC}")

        if is_fullscreen and devtools_is_active:
            # Open devtools
            window.type_keys("{F12}")


def toggler2(json_data):
    handle = get_handle(json_data["title"])
    app = pywinauto.application.Application().connect(handle=handle)
    window = app.window(handle=handle)

    coord_x = json_data["clientX"]
    coord_y = json_data["clientY"]
    if not json_data["isFullscreen"]:
        coord_x += 8
        barHeight = json_data["barHeight"]
        if json_data["autoGetBarHeight"]:
            barHeight = get_bar_height(json_data["title"])
        coord_y = coord_y + barHeight + 1

    # Open context menu
    window.click_input(button="right", coords=(coord_x, coord_y))
    # Open translation menu and toggle translation
    window.type_keys("t{ENTER}")
    # Close translation menu
    window.type_keys("{ESC}")


def edge_toggler(json_data):
    import time

    handle = get_handle(json_data["title"])
    app = pywinauto.application.Application(backend="uia").connect(
        handle=handle
    )
    window = app.window(handle=handle)

    devtools_is_active = window.child_window(
        title="DevTools", control_type="Document"
    ).exists()

    if devtools_is_active:
        window.type_keys("{F12}")

    if json_data["translationCount"] == 1:
        window.type_keys("^{F6}")
        window.type_keys("+{F10}")
        window.type_keys("t")
        window.type_keys("{ESC}")
        time.sleep(1)
        window.type_keys("{ESC}")
    else:
        window.type_keys("^{F6}")
        window.type_keys("{F6}{F6}")
        window.type_keys("{TAB}{ENTER}")
        if "translated" in json_data and json_data["translated"]:
            pywinauto.keyboard.send_keys("{VK_RIGHT}{ENTER}")
        elif "translated" in json_data and not json_data["translated"]:
            pywinauto.keyboard.send_keys("{ENTER}")
        else:
            view4 = window.child_window(
                auto_id="view_4", control_type="Button", found_index=0
            )
            if view4.exists() and view4.class_name() == "MdTextButton":
                # pywinauto.keyboard.send_keys("{RIGHT}{ENTER}")
                view4.click_input(button="left")
            else:
                pywinauto.keyboard.send_keys("{ENTER}")
                pywinauto.keyboard.send_keys("{ESC}")
            time.sleep(1)
            window.type_keys("{ESC}")

    if devtools_is_active:
        window.type_keys("{F12}")


if __name__ == "__main__":
    json_data = json.loads(read_stdin())
    mode = json_data["mode"]
    if mode == "get_bar_height":
        get_bar_height(json_data["title"])
    elif mode == "type-keys":
        toggler1(json_data)
    elif mode == "right-click":
        toggler2(json_data)
    elif mode == "edge-mode":
        edge_toggler(json_data)

    sys.exit(0)

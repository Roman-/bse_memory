$(document).ready(function() {
    if (Glob.currentLocale == '')
        loLanguage();
    else
        loMain();

    initMenu();
    bindHotKeys();

    Glob.nightModeOn = (loadLocal('Glob.nightModeOn') == 'true');
    if (Glob.nightModeOn)
        DarkReader.enable();
});

// hotkeys
function bindHotKeys() {
    // `: call mnemobrowser
    // Esc: close mnemobrowser
    $(document).on('keydown', hotKeyDown);
}

// hotkeys handler
function hotKeyDown(event) {
    let key = (event.keyCode ? event.keyCode : event.which);
    switch(key) {
        case 192: // backquote
            if (event.ctrlKey && $("#mnemoBrowserModal").length == 0)
                (new MnemoBrowser).start();
            break;
    }
}

// change text on top bar
function onTitleChange(content) {
    $("#barTitle").html(content);
}

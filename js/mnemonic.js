MnemonicEngine = function () {}
MnemonicEngine.imgsRawString = defaultMnemonicsString();
MnemonicEngine.imgs = [];

$(document).ready(function() {
    MnemonicEngine.imgsRawString = loadLocal("MnemonicEngine.imgsRawString", defaultMnemonicsString());
    MnemonicEngine.imgs = MnemonicEngine.imgsRawString.trim().split(/\r?\n/);
});

// returns array with default mnemonic images TODO from default text file
function defaultMnemonicsString() {
    let s = "";
    for (let i = 0; i < 1000; ++i)
        s += ('образ №' + i + "\n");
    return s;
}

// returns mnemonic image for number(s) in numberString
// numberString can be "323 388 294" - in this case, 3 words separated by "<br>" will be returned
MnemonicEngine.img = function (numberString) {
    let result = [];
    (numberString+'').split(' ').forEach(function (s) {
        let n = parseInt(s);
        if (n >= 0 && n < MnemonicEngine.imgs.length)
            result.push(MnemonicEngine.imgs[n])
    });
    return result.join('<br>');
}


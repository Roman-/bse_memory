function WordsEngine() {}
WordsEngine.currentDict = null;

// uppercase accented -> uppercase non-accented
WordsEngine.accentMap = {
    "Ё": "Е",
}
String.prototype.replaceAccents=function() {return this.replace(/[^A-Za-z0-9\[\] ]/g,function(a){return WordsEngine.accentMap[a]||a})};

// returns if two words match: 1 if full match(case-insensitive), 0.5 if leven.dist.<=1, 0 if not match
WordsEngine.wordsMatch = function(a,b) {
    let a1 = a.trim().toUpperCase().replaceAccents();
    let b1 = b.trim().toUpperCase().replaceAccents();

    let isCloseGuess = function(a, b) {
        return a.length > 2 && b.length > 2 && (levenDist(a1,b1)) <= 1;
    }

    let match = (a1 === b1) ? 1 : (isCloseGuess(a1, b1) ? 0.5 : 0);
    return match;
}

// dict object: key - filename (without .txt)
WordsEngine.dicts = {
    'ru-nouns-top2k': {
        name: "Топ-2000 существительных",
        descr: "Топ-2000 существительных русского языка, обобщённые",
        lang: "RU",
    },
    'ru-top': {
        name: "Топ-5000 русских слов",
        descr: "Топ-5000 русских слов русского языка, обобщённые",
        lang: "RU",
    },
    'en-nouns-top1k': {
        name: "Top English nouns",
        descr: "Top English nouns, about 1000 simple words",
        lang: "EN",
    },
    'en-basic-1k': {
        name: "Basic English words",
        descr: "Top English words, about 1000 simple words",
        lang: "EN",
    },
    'es-all-1k': {
        name: "Spanish top 1000",
        descr: "...",
        lang: "ES",
    },

    // fun dictionaries
    'emoji-faces': {
        name: "&#128516; Emoji (faces)",
        descr: "...",
        lang: "EN",
    },
    'emoji-all': {
        name: "&#128664;  Emoji (all)",
        descr: "...",
        lang: "EN",
    },
    'ru-surnames': {
        name: "Российские фамилии",
        descr: "...",
        lang: "RU",
    },
};

WordsEngine.CUSTOM_PREFIX = 'custom-';

WordsEngine.loadCustomDicts = function() {
    let raw = loadLocal('CustomDicts', '{}');
    let customDicts = JSON.parse(raw);
    for (let key in customDicts) {
        WordsEngine.dicts[key] = {
            name: customDicts[key].name,
            descr: '',
            lang: customDicts[key].lang,
            custom: true
        };
    }
};

WordsEngine.saveCustomDict = function(key, name, lang, wordsText) {
    // Update in-memory dicts
    WordsEngine.dicts[key] = { name: name, descr: '', lang: lang, custom: true };
    // Save word data
    saveLocal('CustomDict-' + key, wordsText);
    // Update index
    let index = JSON.parse(loadLocal('CustomDicts', '{}'));
    index[key] = { name: name, lang: lang };
    saveLocal('CustomDicts', JSON.stringify(index));
};

WordsEngine.deleteCustomDict = function(key) {
    delete WordsEngine.dicts[key];
    localStorage.removeItem('CustomDict-' + key);
    let index = JSON.parse(loadLocal('CustomDicts', '{}'));
    delete index[key];
    saveLocal('CustomDicts', JSON.stringify(index));
};

WordsEngine.resetCustomDicts = function() {
    let index = JSON.parse(loadLocal('CustomDicts', '{}'));
    for (let key in index) {
        delete WordsEngine.dicts[key];
        localStorage.removeItem('CustomDict-' + key);
    }
    localStorage.removeItem('CustomDicts');
};

WordsEngine.cacheDict = function (dictName) {
    // disable button for a moment
    $("button#startGetReady").attr('disabled', true);
    onTitleChange("Загрузка словаря...");
    onDictLoaded = function (data) {
        WordsEngine.currentDict = data.trim().split(/\r?\n/);
        shuffle(WordsEngine.currentDict);
        MemoEngine.indexOfWord = 0;
        $("button#startGetReady").attr('disabled', false);
        onTitleChange(MemoEngine.eventTitle('words'));
    }
    if (WordsEngine.dicts[dictName] && WordsEngine.dicts[dictName].custom) {
        let data = loadLocal('CustomDict-' + dictName, '');
        onDictLoaded(data);
    } else {
        jQuery.get("data/dicts/" + dictName + ".txt", onDictLoaded);
    }
}

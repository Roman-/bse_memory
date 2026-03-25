function DictManager() {}

// Opens the dict manager in a fullscreen modal
DictManager.open = function() {
    let content = $("<div id='dmContent'></div>");
    showBsModal(content, tr('Manage Dictionaries'), true, 'dictManagerModal');
    DictManager.loList();

    // Refresh dictionary select when modal closes
    $('#dictManagerModal').on('hidden.bs.modal', function() {
        let sel = $('select#dictionary');
        if (sel.length) {
            let currentVal = sel.val();
            sel.empty();
            for (let d in WordsEngine.dicts) {
                let label = WordsEngine.dicts[d].custom ? '\u2605 ' + WordsEngine.dicts[d].name : WordsEngine.dicts[d].name;
                sel.append($("<option></option>").html(label).val(d));
            }
            if (WordsEngine.dicts[currentVal]) {
                sel.val(currentVal);
            } else {
                sel.val('en-nouns-top1k');
                WordsEngine.cacheDict('en-nouns-top1k');
            }
        }
    });
};

// List layout: shows all custom dicts with edit/delete buttons
DictManager.loList = function() {
    let div = $("<div class='container p-3'></div>");

    let addBtn = $("<button class='btn btn-success mb-3'></button>")
        .html('<i class="fa fa-plus"></i> ' + tr('Add Dictionary'))
        .click(function() { DictManager.loEdit(null); });
    div.append(addBtn);

    let customDicts = JSON.parse(loadLocal('CustomDicts', '{}'));
    let keys = Object.keys(customDicts);

    if (keys.length === 0) {
        div.append($("<p class='text-muted'></p>").html(tr('No custom dictionaries')));
    } else {
        let list = $("<ul class='list-group'></ul>");
        for (let key in customDicts) {
            let d = customDicts[key];
            let li = $("<li class='list-group-item d-flex justify-content-between align-items-center'></li>");
            li.append($("<span></span>").html(d.name + ' <small class="text-muted">(' + d.lang + ')</small>'));

            let btnGroup = $("<div></div>");
            btnGroup.append($("<button class='btn btn-sm btn-outline-primary mr-1'></button>")
                .html('<i class="fa fa-edit"></i>')
                .attr('data-key', key)
                .click(function() { DictManager.loEdit($(this).attr('data-key')); }));
            btnGroup.append($("<button class='btn btn-sm btn-outline-danger'></button>")
                .html('<i class="fa fa-trash"></i>')
                .attr('data-key', key)
                .click(function() { DictManager.confirmDelete($(this).attr('data-key')); }));

            li.append(btnGroup);
            list.append(li);
        }
        div.append(list);

        div.append($("<hr>"));
        div.append($("<button class='btn btn-outline-danger'></button>")
            .html('<i class="fa fa-undo"></i> ' + tr('Reset to Defaults'))
            .click(function() { DictManager.confirmResetAll(); }));
    }

    $("#dmContent").empty().append(div);
};

// Edit/Add layout
DictManager.loEdit = function(key) {
    let isNew = (key === null);
    let existingName = '';
    let existingLang = 'EN';
    let existingWords = '';

    if (!isNew) {
        let index = JSON.parse(loadLocal('CustomDicts', '{}'));
        existingName = index[key].name;
        existingLang = index[key].lang;
        existingWords = loadLocal('CustomDict-' + key, '');
    }

    let div = $("<div class='container p-3'></div>");

    div.append($("<button class='btn btn-secondary mb-3'></button>")
        .html('<i class="fa fa-arrow-left"></i> ' + tr('Back'))
        .click(function() { DictManager.loList(); }));

    let nameInput = $("<input type='text' class='form-control mb-2'/>")
        .attr('placeholder', tr('Dictionary name'))
        .val(existingName);

    let langSelect = $("<select class='form-control mb-2'></select>");
    ['EN', 'RU', 'ES', 'DE', 'FR', 'IT', 'PT', 'ZH', 'JA', 'KO'].forEach(function(l) {
        langSelect.append($("<option></option>").val(l).html(l));
    });
    langSelect.val(existingLang);

    let textarea = $("<textarea class='form-control mb-2' rows='15'></textarea>")
        .attr('placeholder', tr('Enter words, one per line'))
        .val(existingWords);

    let wordCount = $("<small class='text-muted'></small>");
    textarea.on('input', function() {
        let count = $(this).val().trim().split(/\r?\n/).filter(function(w) { return w.trim() !== ''; }).length;
        wordCount.html(count + ' ' + tr('Words').toLowerCase());
    }).trigger('input');

    let saveBtn = $("<button class='btn btn-success form-control mt-2'></button>")
        .html(tr('Save'))
        .click(function() {
            let name = nameInput.val().trim();
            let lang = langSelect.val();
            let words = textarea.val();

            nameInput.removeClass('is-invalid');
            textarea.removeClass('is-invalid');

            if (!name) { nameInput.addClass('is-invalid'); return; }
            if (!words.trim()) { textarea.addClass('is-invalid'); return; }

            let dictKey = key;
            if (isNew) {
                dictKey = WordsEngine.CUSTOM_PREFIX + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                if (WordsEngine.dicts[dictKey]) {
                    dictKey += '-' + Date.now();
                }
            }

            WordsEngine.saveCustomDict(dictKey, name, lang, words);
            DictManager.loList();
        });

    div.append(
        $("<label></label>").html(tr('Dictionary name')), nameInput,
        $("<label></label>").html(tr('Language')), langSelect,
        $("<label></label>").html(tr('Words (one per line)')), textarea, wordCount,
        saveBtn
    );

    $("#dmContent").empty().append(div);
};

DictManager.confirmDelete = function(key) {
    let name = WordsEngine.dicts[key] ? WordsEngine.dicts[key].name : key;
    if (confirm(tr('Delete dictionary') + ' "' + name + '"?')) {
        WordsEngine.deleteCustomDict(key);
        DictManager.loList();
    }
};

DictManager.confirmResetAll = function() {
    if (confirm(tr('Delete all custom dictionaries?'))) {
        WordsEngine.resetCustomDicts();
        DictManager.loList();
    }
};

function SetupLay() {}
function Fields() {}

// Fields: functions that returns standard field object: {label:string, descr:string, input: jquery input}

// fileds used in game settings
Fields.numItems = function(setup, labelText = '', descrText = '', min = 1, max = 1000, step = 5) {
    return {
        label: labelText,
        descr: descrText,
        input: $("<input type='number' id='numItems'/>")
            .attr('min', min)
            .attr('max', max)
            .attr('step', step)
            .val(setup.numItems)
    }
}

// allowPattern if true, reutrns text field where user can input "3 2 3", else single digit
Fields.groupBy = function (setup, labelText = '', descrText = '', allowPattern = false, min = 1, max = 10) {
    if (allowPattern) {
        return {
            label: labelText,
            descr: descrText,
            input: $("<input type='text' pattern='[\d\s]+'/>")
                .attr('placeholder', tr('Example: 3 2 3'))
                .attr('id', setup.event == 'spoken' ? 'displayNumBy' : 'groupBy')
                .val(setup.event == 'spoken' ? setup.displayNumBy : setup.groupBy)
        }
    } else {
        return {
            label: labelText,
            descr: descrText,
            input: $("<input type='number'/>")
                .attr('id', setup.event == 'spoken' ? 'displayNumBy' : 'groupBy')
                .val(setup.event == 'spoken' ? setup.displayNumBy : setup.groupBy)
                .attr('min', min)
                .attr('max', max)
        }
    }
}

// returns <select> with time (concentration/distraction) options
// id - select DOM element id
// noTimeText - text for value=0 sec. If null, do not include 0 sec option.
function jqSelectDistractionTime(id, noTimeText = null) {
    let select = $("<select data-ismisc='1'></select>")
        .addClass('form-control')
        .attr('id', id);
    // opts: title -> seconds
    let opts = [
        ['3 '  + tr('second2'),    3],
        ['5 '  + tr('second5'),    5],
        ['10 ' + tr('second5'),    10],
        ['30 ' + tr('second5'),    30],
        ['1 '  + tr('minute1'),    60],
        ['3 '  + tr('minute2'),    3*60],
        ['5 '  + tr('minute5'),    5*60],
    ];
    if ('string' === typeof noTimeText)
        select.append($("<option></option>").html(noTimeText).val(0));
    opts.forEach(function (pair) {
        select.append($("<option></option>").html(pair[0]).val(pair[1]));
    });
    return select;
}

// returns <select> with time intervals options
// id - select DOM element id
function jqSelectTimeLimit(id) {
    let select = $("<select></select>")
        .addClass('form-control')
        .attr('id', id);
    // opts: title -> seconds
    let opts = [
        [tr('unlimited'),    0],
        ['30 '  + tr('second5'),   30],
        ['1 '  + tr('minute1'),    60],
        ['2 '  + tr('minute2'),    2*60],
        ['3 '  + tr('minute2'),    3*60],
        ['4 '  + tr('minute2'),    4*60],
        ['5 '  + tr('minute5'),    5*60],
        ['7 '  + tr('minute5'),    7*60],
        ['10 '  + tr('minute5'),    10*60],
        ['15 '  + tr('minute5'),    15*60],
        ['30 '  + tr('minute5'),    30*60],
        ['45 '  + tr('minute5'),    45*60],
        ['1 '  + tr('hour'),         60*60],
    ];
    opts.forEach(function (pair) {
        select.append($("<option></option>").html(pair[0]).val(pair[1]));
    });
    return select;
}

Fields.timeLimit = function(setup) {
    return {
        label: tr('Memorization time'),
        descr: tr('Time limit'),
        input:  jqSelectTimeLimit('timeLimit').val(setup.timeLimit)
    }
}

// isMisc - if field needs to be put in misc settings section (collapsed)
Fields.recallTimeLimit = function(setup, isMisc = true) {
    return {
        label: tr('Recall time'),
        descr: tr('Time to recall (input) what you have memorized'),
        input:  jqSelectTimeLimit('recallTimeLimit').val(setup.timeLimit)
                .val(setup.recallTimeLimit)
                .attr('data-ismisc', isMisc ? '1' : '0')
    }
}

Fields.distractionTime = function (setup, isMisc = true) {
    return {
        label: tr('Pause before recall'),
        descr: tr('Distracting screen time before recall'),
        input:  jqSelectDistractionTime('distractionTime', tr('No pause')).val(setup.distractionTime)
                .val(setup.distractionTime)
                .attr('data-ismisc', isMisc ? '1' : '0')
    }
}

Fields.concentrationTime = function (setup, isMisc = true) {
    return {
        label: tr('Concentration time'),
        descr: tr("Time for concentration before memorization stage"),
        input:  jqSelectDistractionTime('concentrationTime', null).val(setup.concentrationTime)
                .val(setup.concentrationTime)
                .attr('data-ismisc', isMisc ? '1' : '0')
    }
}

Fields.interval = function (setup, labelText = 'Автопереход, сек', isMisc = true) {
    return {
        label: '<span id="intervalLabel">'+labelText+'</span>',
        descr: tr("Time interval between displays, sec"),
        input: $("<input type='number' id='interval' min='0.0' max='30' step='0.1' data-decimals='2'/>")
                .val(setup.interval)
                .change(function () {
                    let labelCrossed = ($(this).val() == 0);
                    $("#intervalLabel").css('text-decoration', labelCrossed ? 'line-through' : 'none');
                })
                .attr('data-ismisc', (isMisc ? 1 : 0))
    }
}

Fields.textSize = function (setup) {
    jqSelectTextSize = function () {
        let select = $("<select id='textClass' data-ismisc='1'></select>").addClass('form-control');
        let opts = ['display-1', 'display-2', 'display-3', 'display-word'];
        opts.forEach(function (o) {
            select.append($("<option></option>").html(o).val(o));
        });
        return select;
    }
    return {
        label: tr('Font size'),
        descr: '',
        input: jqSelectTextSize().val(setup.textClass),
    }
}

Fields.recallMethod = function (setup) {
    jqSelectRecallMethod = function () {
        let select = $("<select id='recallMethod' data-ismisc='1'></select>").addClass('form-control');
        let opts = [tr('One field'), tr('Column of inputs')];
        $.each(opts, function (index, o) {
            select.append($("<option></option>").html(o).val(index));
        });
        return select;
    }

    return {
        label: tr('Recall input method'),
        descr: tr("How to display input fields"),
        input: jqSelectRecallMethod().val(setup.recallMethod),
    }
}

Fields.hintOnClick = function (setup) {
    return {
        label: tr("Hint on click"),
        descr: tr("When you click on the element, a corresponding word is showed"),
        input: $("<input type='checkbox' id='hintOnClick' data-ismisc='1'/>").prop("checked", setup.hintOnClick),
    }
}

Fields.getReadyTick = function (setup) {
    return {
        label: tr('Ticks'),
        descr: 'Ticking sounds during concentration stage',
        input: $("<input type='checkbox' id='getReadyTick' data-ismisc='1'/>").prop("checked", setup.getReadyTick),
    }
}

// voice select
Fields.voice = function (setup) {
    jqSelectSpokenVoice = function () {
        let select = $("<select id='spokenVoice'></select>").addClass('form-control');
        // map: folder name => voice name
        const voices = {
            'male' : 'Male',
            'female' : 'Female',
            'male-slow' : 'Male: slow',
            'ru-female' : 'Женский',
        }
        for (let folder in voices) {
            select.append($("<option></option>").html(voices[folder]).val(folder));
        }
        return select;
    }

    let testVoiceBtn = $(" <button class='btn btn-outline-info btn-sm'><i class='fa fa-play'></i></button>")
        .click(function () {MemoEngine.testSpokenVoice(); $("#startGetReady").focus();});
    let voiceLabel = $("<span></span>").html(tr('Voice') + " ").append(testVoiceBtn);

    return {
        label: voiceLabel,
        descr: tr('Voice-digits'),
        input: jqSelectSpokenVoice().val(setup.spokenVoice)
            .change(function () {
                MemoEngine.cacheVoices($(this).val());
            })
    }
}

// words dictionary select
Fields.dictionary = function (setup) {
    jqSelectDict = function () {
        let select = $("<select id='dictionary'></select>").addClass('form-control');
        // map: folder name => voice name
        for (let d in WordsEngine.dicts) {
            select.append($("<option></option>").html(WordsEngine.dicts[d].name).val(d));
        }
        return select;
    }

    return {
        label: tr('Dictionary'),
        descr: tr("Set of words for memorization"),
        input: jqSelectDict().val(setup.dictionary)
            .change(function () {
                WordsEngine.cacheDict($(this).val());
            })
    }
}

// reutrns array of setup elements(input)
SetupLay.getSetupFields = function(setup) {

    // These inuputs are initially set with values from \param setup, which is default/saved game setup for event. After
    // data-ismisc: if specified in the input, place this input under 'misc settings' group
    switch(setup.event) {
    case 'numbers':
    case 'binary':
        return [
            Fields.numItems(setup, tr('Digits amount'), tr('How many digits to memorize')),
            Fields.groupBy(setup, tr('Group by'), tr('Digits in a number'), true),
            Fields.timeLimit(setup),
            Fields.concentrationTime(setup),
            Fields.distractionTime(setup),
            Fields.recallTimeLimit(setup),
            Fields.interval(setup, tr('Autoadvance, sec'), true),
            Fields.textSize(setup),
            Fields.recallMethod(setup),
            Fields.hintOnClick(setup)
        ]

        case 'spoken':
        return [
            Fields.numItems(setup, tr('Max. digits'), tr("Maximum number of called digits"), 3, 1000),
            Fields.interval(setup, tr('Interval, sec'), false),
            Fields.voice(setup),
            Fields.groupBy(setup, tr('Group by'), tr('During review'), false, 1, 10),
            Fields.recallTimeLimit(setup),
            Fields.concentrationTime(setup),
            Fields.distractionTime(setup),
            Fields.recallMethod(setup),
            Fields.hintOnClick(setup),
            Fields.getReadyTick(setup),
        ]
        case 'words':
        return [
            Fields.numItems(setup, tr('Number of words'), tr('How much words to memorize'), 3, 1000, 1),
            Fields.groupBy(setup, tr('Group by'), tr('Words in group'), false, 1, 5),
            Fields.dictionary(setup),
            Fields.timeLimit(setup),
            Fields.concentrationTime(setup),
            Fields.distractionTime(setup),
            Fields.recallTimeLimit(setup),
            Fields.interval(setup, tr('Autoadvance, sec'), true),
            Fields.textSize(setup)
        ]
        case 'color':
        return [
            Fields.numItems(setup, tr('Number of elements'), tr('How many colors to memorize'), 3, 1000),
            Fields.interval(setup, tr('Autoadvance, sec'), false),
        ]
        default: return console.error("get thingy: event not found: ", setup.event);
    }
}

// prepare for event: cache voices etc.
SetupLay.doEventPreparations = function(setup) {
    switch(setup.event) {
        case 'spoken':
            if (MemoEngine.numberOfCachedSounds != 10)
                MemoEngine.cacheVoices(setup.spokenVoice);
            break;
        case 'words':
            if (!WordsEngine.currentDict)
                WordsEngine.cacheDict(setup.dictionary);
        default: break;
    }
}

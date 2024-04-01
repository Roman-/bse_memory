/*
 MnemoBrowser - mnemonics images browser.
 opens in bootstrap modal with content id='mbContent'

 currentNav: [Lookup, Learn, Search, Edit]

 MnemoBrowser.probs = [n0, n1, n2...] - probabilities array. Higher prob means harder image
*/
function MnemoBrowser() {
    var mbLayouts = {
        "Lookup": loLookup,
        "Learn": loLearn,
        "Search": loSearch,
        "Edit": loEdit
    }
    this.start = function (startLayout = 'Lookup') {
        if ($("#mbContent").length == 0) {
            content = $("<div id='mbContent'></div>");
            showBsModal(content, "MnemoBrowser", true, 'mnemoBrowserModal');
        }
        launchLayout = (mbLayouts.hasOwnProperty(startLayout))
            ? mbLayouts[startLayout]
            : loLookup;
        launchLayout();
    };
    MnemoBrowser.currentNav = '';

    // lookup layout: search image by number
    function loLookup() {
        MnemoBrowser.currentNav = 'Lookup';
        let div = $("<div class='container'></div>");

        function inputChanged() {
            let number = Number.parseInt($("#lookupInput").val());
            if (number >= 0)
                imgDiv.html($("<div class='h1'></div>").html(MnemonicEngine.img(number)));
            else
                imgDiv.html(tr('lookupIntroText'));
        }

        input = $("<input class='form-control' id='lookupInput' type='number' placeholder='123' min='0' max='9999'></input>")
            .on('keyup', inputChanged).on('change', inputChanged);
        let imgDiv = $("<div id='imgDiv' class='text-left card card-body'></div>").html(tr('lookupIntroText'));
        div.append(input, imgDiv);

        $("#mbContent").empty().append(jqNavs(), div);

        $("#lookupInput").focus();
    }

    // learn layout
    function loLearn() {
        MnemoBrowser.currentNav = 'Learn';
        let div = $("<div class='container'></div>");

        function showAnswer() {
            $("#loLearnAnswer").html(MnemonicEngine.imgs[MnemoBrowser.numberToLearn]);
        }

        // \param level - 'hard' or 'ok'
        function markQuestion(level) {
            q = $("#loLearnQuestion");
            q.addClass(level == 'hard' ? 'alert-danger' : 'alert-success');
            q.removeClass(level == 'hard' ? 'alert-success' : 'alert-danger');
        }

        function reMarkQuestion(level) {
            q = $("#loLearnQuestion");
            if (q.hasClass('alert-danger') || q.hasClass('alert-success'))
                markQuestion(level);
        }

        function showQuestion() {
            $("#loLearnAnswer").html("<br>");
            MnemoBrowser.numberToLearn = selectNumberByProbs();
            let numberHtml = ("00" + MnemoBrowser.numberToLearn).slice(-3);
            $("#loLearnQuestion").html(numberHtml).removeClass('alert-success').removeClass('alert-danger');
        }

        onAnswer = function () {
            ans = ($("#loLearnQuestion").hasClass('alert-danger')) ? 'hard' : 'ok';
            console.log("marking as: ", ans);
            numberWasReviewed(ans);
            showQuestion();
            saveLocal('MnemoBrowser-probs', JSON.stringify(MnemoBrowser.probs));
        }

        buttonsBar = $("<div id='ankiButtonsBar' class='col-12'></div>").append(
                $("<button class='btn btn-danger col-4' id='btnAnsHard'></button>")
                    .html('Hard<br><kbd>1</kbd>')
                    .tclick(function () {showAnswer(); markQuestion('hard')})
                    .tmove(function () {reMarkQuestion('hard')})
                    .trelease(onAnswer),
                $("<button class='btn btn-success col-8' id='btnAnsOk'></button>")
                    .html('Next<br><kbd>Space</kbd>')
                    .tclick(function () {showAnswer(); markQuestion('ok')})
                    .tmove(function () {reMarkQuestion('ok')})
                    .trelease(onAnswer),
            );

        /*
        if (!MnemoBrowser.mnemoKeyBinded) {
            MnemoBrowser.mnemoKeyBinded = true;

            mnemoLearnKd = function (event) {
                // if expired
                if ($("#loLearnAnswer").length == 0) {
                    $(document).off('keydown', mnemoLearnKd);
                    MnemoBrowser.mnemoKeyBinded = false;
                    console.warn("unbinded mnemoLearnKd");
                    return;
                }
                let key = (event.keyCode ? event.keyCode : event.which);
                switch (key) {
                    case 32:
                        let btnToClick = $("#btnAnsOk").length ? $("#btnAnsOk") : $("#btnShowAns");
                        btnToClick.trigger('click');
                        break;
                    case 97:
                    case 49:
                        $("#btnAnsHard").trigger('click');
                        break;
                }
            }

            $(document).on('keydown', mnemoLearnKd);
        }
        */


        div.append(
                $("<div id='loLearnQuestion' class='text-center display-1'></div>"),
                $("<hr />"),
                $("<div id='loLearnAnswer' class='text-center display-4'></div>"),
                buttonsBar);

        $("#mbContent").empty().append(jqNavs(), div);
        showQuestion();
    }

    // search layout: ...
    function loSearch() {
        MnemoBrowser.currentNav = 'Search';
        let div = $("<div class='container'></div>");

        function inputChanged() {
            let q = $("#searchInput").val().toLowerCase().trim();
            let res = "";
            if (q.length < 2) {
                return $("#searchResults").html("...");
            } else {
                for (let i = 0; i < MnemonicEngine.imgs.length; i++) {
                    let string = MnemonicEngine.imgs[i];
                    if (string.toLowerCase().indexOf(q) !== -1)
                        res += "<div><b>" + i + "</b>: " + string + "</div>";
                }
                if (res.length == 0)
                    res = tr("No results");
                return $("#searchResults").html(res);
            }
        }

        input = $("<input class='form-control' id='searchInput' type='text' placeholder='"+tr("search-by-text")+"'></input>")
            .on('keyup', inputChanged).on('change', inputChanged);
        resultsDiv = $("<div id='searchResults' class='card card-body text-left'></div>");
        div.append(input, resultsDiv);


        $("#mbContent").empty().append(jqNavs(), div);
        $("#searchInput").focus();
    }

    // edit layout: edit your images list
    function loEdit() {
        function textareaChanged() {
            $("#saveImgBtn").html(tr('Save')).removeAttr("disabled");
            $("#saveWarn").show();
        }

        MnemoBrowser.currentNav = 'Edit';
        let div = $("<div class='container'></div>");
        let textarea = $("<textarea id='browserTa' rows='15'></textarea>").val(MnemonicEngine.imgsRawString).width('100%').
            on('change', textareaChanged).on('keyup', textareaChanged);
        let saveBtn = $("<button id='saveImgBtn' class='btn btn-success form-control' disabled></button>").click(function () {
            MnemonicEngine.imgsRawString = textarea.val();
            MnemonicEngine.imgs = MnemonicEngine.imgsRawString.trim().split(/\r?\n/);
            if (saveLocal("MnemonicEngine.imgsRawString", MnemonicEngine.imgsRawString)) {
                $("#saveImgBtn").html('Сохранено').attr("disabled", true);
                $("#saveWarn").hide();
            }
        });
        let warnDiv = $("<div id='saveWarn' class='alert alert-warning'>"+tr("Don\'t forget to save!")+"</div>").hide();
        div.append(textarea, saveBtn, warnDiv);


        $("#mbContent").empty().append(jqNavs(), div);
    }

    // initialize array of images probabilities
    function initProbs() {
        // try to load from local first
        let loaded = loadLocal('MnemoBrowser-probs', null);
        if (loaded != null) {
            console.log("init probs: loaded form local");
            MnemoBrowser.probs = JSON.parse(loaded);
            if (MnemoBrowser.probs.length == MnemonicEngine.imgs.length)
                return;
        }

        MnemoBrowser.probs = [];
        for (let i = 0; i < MnemonicEngine.imgs.length; ++i)
            MnemoBrowser.probs.push(1);
        console.log("init probs: created new");
    }

    // make sum of MnemoBrowser.probs equal to number of elements
    function normalizeProbs() {
        if (typeof MnemoBrowser.probs === 'undefined')
            return initProbs(); // sum = 1 by default
        let sum = sumOfElements(MnemoBrowser.probs);
        let factor = MnemoBrowser.probs.length / sum;

        for (let i = 0; i < MnemoBrowser.probs.length; ++i)
            MnemoBrowser.probs[i] *= factor;

    }

    // using probabilities, pick random number from 0 to MnemonicEngine.imgs.length
    function selectNumberByProbs() {
        normalizeProbs();
        let x = Math.random() * MnemoBrowser.probs.length;
        let index = 0;
        while (index < MnemoBrowser.probs.length) {
            x -= MnemoBrowser.probs[index];
            if (x < 0)
                return index;
            index++;
        }
        console.error("probs selection error: ", MnemoBrowser.probs);
        return 0;
    }

    // when number was reviewed, change its probability (without normalizing)
    // \param difficulty - string {'hard', 'ok', 'easy'}
    function numberWasReviewed(difficulty) {
        let index = MnemoBrowser.numberToLearn;
        let p = MnemoBrowser.probs[index];
        const minProp = 1 / 1000;
        const maxProp = 30;
        switch (difficulty) {
            case 'hard':
                p = Math.max(Math.min(p * 3, 3), maxProp); // prob *= 3 but minimum is 3
                break;
            case 'ok':
                p = Math.max(p * 0.75, minProp); // prob *= 2 but minimum is 2
                break;
            case 'easy':
                p = Math.max(p * 0.5, minProp); // prob *= 2 but minimum is 2
                break;
            default:
                console.error("numberWasReviewed: diff. unknown");
                return;
        }
        MnemoBrowser.probs[index] = p;
    }

    // returns navs (tabs) jq object
    function jqNavs () {
        let ul = $("<ul class='nav'></ul>");
        for (name in mbLayouts) {
            fun = mbLayouts[name];
            isCurrent = (MnemoBrowser.currentNav == name);
            let li = $("<li class='nav-item'></li>").addClass(isCurrent ? 'bg-dark text-white' : '').append(
                $("<a class='nav-link clickable'></a>").html(name).click(fun)
            );
            ul.append(li);
        }
        return ul;
    }
}

MnemoBrowser.imgsByHardness = function() {
    // console.log("MnemoBrowser.probs", MnemoBrowser.probs);
    // compare two numbers by probs
    hardnessCmp = function (lhs, rhs) {
        return MnemoBrowser.probs[rhs] - MnemoBrowser.probs[lhs];
    }

    let result = [];
    for (let i = 0; i < MnemoBrowser.probs.length; ++i)
        result.push(i);
    result.sort(hardnessCmp);
    return result;
}

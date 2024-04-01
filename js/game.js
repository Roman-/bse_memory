/*
 * Game settings. Typical init: new Game({event: numbers})
{
  event: string             // [numbers, binary, words, spoken, images, letters, faces, color]
  numItems : int            // number of items to memorize
  timeLimit: int            // if >0, limit memorization time to this value (in seconds)
  recallTimeLimit: int      // if >0, limit recall time to this value (in seconds)
  distractionTime: int // if >0, display distractino screen after memo (in seconds)
  concentrationTime: int // if >0, display distractino screen after memo (in seconds)
  interval:  float          // time interval between flashes, in seconds. If 0, no interval
  groupBy:   string/int     // number of elements in one item, i.e. digits in number, binary in number etc. May be "4 4", 1101 1000
  textClass: string         // class name of item text: [display-1, display-2, display-3, display-word]

  // other settings

  displayTable:  bool       // whether to display table underneath
  alternateBg:   bool       // whether to alternate background color between events
  hintOnClick:   bool       // turn on HINTs. If enabled, clicking on the element displays 'hint' - text for image
  getReadyTick:  bool       // when getReady screen updates, play ticking sound

  // event-specific
  dictionary: string        // words memo dictionary
  spokenVoice : string      // spoken numbers voice
  displayNumBy: string/int  // same as groupBy but for spoken numbers for displaying results table
  recallMethod: int         // recall: one textarea (1) / column of inputs (2)

  // in-game-related

  currentIndex: int        // index of current group of items displaying on the screen
  seq:          array[int] // sequence of elements to memorize
  inputArr      array[int] // what user has inputted as his answer

  getReadyStartMs:  int    // timestamp (ms) when game was started
  memoStartMs:      int    // timestamp (ms) when the game was started, for measuring memo time
  recallStartMs:    int    // timestamp (ms) when the game was ended and recall started, for measuring memo time
  recallEndMs:      int    // timestamp (ms) when the recall was started, for measuring memo time
}
_______ Timers
Game.gameTimer - for timing get-ready, making flashes, timing recall, timing distraction
Game.memoTimeTimer - for displaying current memo time (or remaining time)
Game.distractionStartMs - for distraction screen
 * */

function Game() {
    this.start = loSettings;

    // return jquery object for settings div
    function jqSettings(setup = null) {

        let div = $("<div id='gameSetup' ></div>")
            .append($("<input type='hidden' id='eventName' value='"+setup.event+"'/>"));

        let rowsMain = $("<div></div>"); // visible settings
        let rowsMisc = $("<div class='card card-body'></div>"); // collapsed settings
        SetupLay.getSetupFields(setup).forEach(function (field) {
            let id = field.input.prop('id');
            let rows = (field.input.attr('data-ismisc') == '1') ? rowsMisc : rowsMain;
            rows.append(
                $("<div class='form-group row'></div>").append(
                    $("<label for='"+id+"' class='col-sm-3 col-form-label text-left'></label>")
                        .html(field.label).prop('title', field.title)
                  , $("<div class='col-sm-3'></div>").append(field.input.addClass('form-control')).prop('title', field.title)
                )
            );
        });
        div.append(rowsMain);
        if (rowsMisc.html() != "") {
            let collapseBtn = $("<button class='btn btn-secondary form-control' data-toggle='collapse' data-target='#rowsMisc'></button>").html(tr("Advanced"));
            div.append(collapseBtn, $("<div class='collapse' id='rowsMisc'></div>").html(rowsMisc));
        }

        return div;
    }

    // returns jq for table (underneath) with elements to be memorized
    function jqMemoTable() {
        let container = $("<div id='memoTable'></div>");
        let numGroups = MemoEngine.groupsInSeq(Game.setup);
        for (let gr = 0; gr < numGroups; gr++) {
            let item = MemoEngine.getGroup(Game.setup.event
                    , gr
                    , Game.setup.seq
                    , Game.setup.groupBy);

            let elDiv = $("<div class='memoTableElement' id='mte"+gr+"' data-index='"+gr+"'></div>")
                .tclick(function () {
                    Game.setup.currentIndex = Number.parseInt($(this).attr('data-index'));
                    resetFlashInterval();
                    makeAflash();
                });
            MemoEngine.placeItemInElTable(item, elDiv, Game.setup);
            container.append(elDiv);
        }
        if (Game.setup.displayTable === false)
            container.css('display', 'none');
        return container;
    }

    // displays next flash number on the screen, increasing current flash index
    function makeAflash() {
        // check if game is expired (not on layout anymore)
        let container = $("#itemContainer");
        if (!container.length) {
            stopTimer(Game.gameTimer);
            unbindGameKeyDown();
            return;
        }
        let item = MemoEngine.getGroup(Game.setup.event, Game.setup.currentIndex
                    , Game.setup.seq
                    , Game.setup.groupBy);
        if (item === null) {
            stopTimer(Game.gameTimer);
            loDistraction();
            return;
        }


        // alternate background or give a flash effect
        if (Game.setup.alternateBg) {
            container.css('background-color', (Game.setup.currentIndex % 2) ? '#eeeeee' : '#e5e5e5');
        } else {
            container.css("opacity", "0.5");
            setTimeout(function () {container.css("opacity", "1");}, 30)
        }

        // [numbers, binary, words, spoken, images, letters, faces, color]
        MemoEngine.placeItemInContainer(item, container, Game.setup);

        Game.setup.currentIndex++;

        let numGroups = MemoEngine.groupsInSeq(Game.setup);
        let percent = 100 * Game.setup.currentIndex / numGroups;
        $("#gameProgressBar")
            .attr('aria-valuenow', Game.setup.currentIndex)
            .width(percent + '%');
        $("#positionDiv").html(Game.setup.currentIndex + ' of ' + numGroups);

        // table
        $(".memoTableElement").removeClass('alert-warning');
        $("div#mte" + (Game.setup.currentIndex - 1)).addClass('alert-warning');

    }

    // returns jq object with results: 48/50 in 29.14
    // qArray - initial array of numbers
    // aArray - user answers (input) array
    function jResultsDiv(qArray, aArray) {
        let numCorrect = 0; // number of correctly recalled elements
        let numTotal = qArray.length; // number of total elements to recall
        for (let i = 0; i < numTotal; ++i) {
            let q = qArray[i];
            let a = (i < aArray.length) ? aArray[i] : '-';
            if (q == a)
                numCorrect++;
        }
        let allCorrect = (numCorrect == numTotal);
        let digitsLabel = allCorrect ? (numCorrect) : (numCorrect + "/" + numTotal);
        let digitsSpan = $("<span></span>").html(digitsLabel).addClass(allCorrect ? 'allCorrectResult' : '');
        return $("<div></div>").addClass('h1').append(digitsSpan, " "+tr('in-s')+" " + getMemoTimeText() + " " + tr("sec."));
    }

    // returns jq object with results for spoken numbers: 48 in 29.14
    // qArray - initial array of numbers
    // aArray - user answers (input) array
    function jSpokenResultsDiv(qArray, aArray) {
        let numCorrect = 0; // total number of correctly recalled elements
        let numStreaked = 0; // number of correctly recalled elements from the beginning (streak)
        let numTotal = qArray.length; // number of total elements to recall
        let streak = true; // when false, finish points counting
        for (let i = 0; i < numTotal; ++i) {
            let q = qArray[i];
            let a = (i < aArray.length) ? aArray[i] : '-';
            if (q == a) {
                numCorrect++;
                numStreaked += (streak) ? 1 : 0;
            } else {
                streak = false;
            }

        }
        let allCorrect = (numStreaked == numTotal);
        let digitsLabel = numStreaked;
        let digitsSpan = $("<span></span>").html(digitsLabel).addClass(allCorrect ? 'allCorrectResult' : '');
        let interval = Game.setup.interval;
        let intervalLabel = interval == 1 ? ""
            : (interval ? (" with interval " + interval + " " + tr("sec.")) : tr(" no interval"));
        let h1 = $("<div></div>").addClass('h1').append(digitsSpan, intervalLabel);

        let resultsDiv = $("<div></div>").append(h1);
        if (numStreaked != numCorrect)
            resultsDiv.append($("<div></div>").html(tr('Total correct') + ': ' + numCorrect + "/" + numTotal));

        return resultsDiv;
    }

    // returns color in colors event, based on seq and inputArr, calculate and add.
    function jColorResultsDiv() {
        let score=0;
        for (let i = 0; i < Game.setup.seq.length; ++i) {
            let colorQ = Game.setup.seq[i];
            let colorA = Game.setup.inputArr[i];
            let match = colorMatch(colorQ, colorA);
            score += match;
        }
        let scoreRatio = score > 0
            ? (score + tr(" of ") + Game.setup.seq.length*3)
            : '0';
        return $("<div class='h1'></div>").html(scoreRatio +" "+tr("in-s")+" "+ getMemoTimeText());
    }

    function jWordsResultsDiv() {
        let score = 0;
        for (let i = 0; i < Game.setup.seq.length; ++i) {
            let q = Game.setup.seq[i].trim();
            let a = Game.setup.inputArr[i].trim();
            let match = WordsEngine.wordsMatch(q, a);
            score += match;
        }
        let scoreText = (score == Game.setup.seq.length) ? ("<b>"+score+"</b>") : (score + "/" + Game.setup.seq.length);
        return $("<div class='h1'></div>").html(scoreText +" "+tr("in-s") +" "+ getMemoTimeText());
    }

    // returns jq object with words-memo comparison table
    function jWordsResultsTable() {
        let table = $("<table class='wordsMatchTable table'></table>")
            .append($("<tr><th>#</th><th>"+tr("Original")+"</th><th>"+tr("Answer")+"</th></tr>"));
        for (let i = 0; i < Game.setup.seq.length; ++i) {
            let q = Game.setup.seq[i].trim();
            let a = Game.setup.inputArr[i].trim();
            let match = WordsEngine.wordsMatch(q, a);
            let className = (match === 1) ? "alert-success" : (match == 0.5 ? 'alert-warning' : 'alert-danger');
            let row = $("<tr></tr>").append(
                    $("<td class='text-muted'></td>").html(i+1),
                    $("<td></td>").html(q),
                    $("<td></td>").html(a).addClass(className)
                    );
            table.append(row);
        }
        return $("<div class='container'></div>").append(table);
    }

    // returns jq object with color-memo comparison table TODO out to htmlgen
    function jColorResultsTable() {
        let score = 0;
        let table = $("<table class='colorMatchTable table'></table>")
            .append($("<tr><th>"+tr("Original")+"</th><th>"+tr("Answer")+"</th><th>"+tr("Match")+"</th></tr>"));
        for (let i = 0; i < Game.setup.seq.length; ++i) {
            let colorQ = Game.setup.seq[i];
            let textColorQ = tinycolor.mostReadable(colorQ, ["#000", "#fff"]).toHexString();
            let colNameQ = tinycolor(colorQ).toRgbString().substr(3);
            let colorA = Game.setup.inputArr[i];
            let textColorA = tinycolor.mostReadable(colorA, ["#000", "#fff"]).toHexString();
            let colNameA = tinycolor(colorA).toRgbString().substr(3);
            let match = colorMatch(colorQ, colorA);
            let row = $("<tr></tr>").append(
                    $("<td></td>").css('background-color', colorQ).html(colNameQ).css('color', textColorQ),
                    $("<td></td>").css('background-color', colorA).html(colNameA).css('color', textColorA),
                    $("<td></td>").html(match).css('font-weight', (match == 3 ? 'bold' : 'normal'))
                    );
            table.append(row);
            score += match;
        }
        return table;
    }

    // returns jq object with comparison table
    // qArray - initial array of numbers
    // aArray - user answers (input) array
    function jResultsHtmlTable(qArray, aArray) {
        let table = $("<table class='table'></table>")
            .append($("<tr><th>#</th><th>"+tr("Original")+"</th><th>"+tr("Answer")+"</th></tr>"));
        let groupSize = Game.setup[(Game.setup.event == 'spoken') ? 'displayNumBy' : 'groupBy'];
        let numGroups = MemoEngine.groupsInSeq(Game.setup, groupSize);
        for (let gIndex = 0; gIndex < numGroups; ++gIndex) {
            let q = MemoEngine.getGroup(Game.setup.event, gIndex, qArray , groupSize);
            let a = MemoEngine.getGroup(Game.setup.event, gIndex, aArray , groupSize);
            a = a ? a : "-";
            let match = (q === a);

            let row = $("<tr></tr>").append(
                    $("<td class='text-muted'></td>").html(gIndex+1),
                    $("<td></td>").html(q),
                    $("<td></td>").html(a).addClass(match ? "alert alert-success" : "alert alert-danger"),
                    );
            table.append(row);
        }
        return table;
    }

    // layout with 'check results'
    function loReview() {
        onTitleChange(MemoEngine.eventTitle(Game.setup.event));
        let tryAgainBtn = $("<button class='btn btn-primary form-control'></button>").html(tr('Try again')).click(loGetReady);
        let settingsAgainBtn = $("<button class='btn btn-primary  form-control'></button>").html(tr("Settings"))
            .click( function () {loSettings(Game.setup)} );

        let resultDiv = $("<div>Result for event "+Game.setup.event+"</div>");
        let reviewDiv = $("<div>Review event "+Game.setup.event+"</div>");
        let timediff = Game.setup.recallEndMs - Game.setup.recallStartMs;
        let recallTimeDiv = $("<div class='text-left'></div>").html(
                 tr("Recall time") + ": <b>" + msToHumanReadable(timediff) + "</b>s<br>"
               + tr("Result has been set") + " <b>" + (new Date()).toLocaleString() + "</b>");
        switch(Game.setup.event) {
            case 'numbers':
            case 'binary':
                memoArray = Game.setup.seq.join('').split('');
                answerArray = Game.setup.inputArr.replace(/[\s\n\r]+/g, '').split('');
                resultDiv = jResultsDiv(memoArray, answerArray);
                reviewDiv = jResultsHtmlTable(memoArray, answerArray);
                break;
            case 'spoken':
                answerArray = Game.setup.inputArr.replace(/[\s\n\r]+/g, '').split('');
                memoArray = Game.setup.seq.join('').substr(0, Game.setup.currentIndex).split('');
                resultDiv = jSpokenResultsDiv(memoArray, answerArray);
                reviewDiv = jResultsHtmlTable(memoArray, answerArray);
                break;
            case 'color':
                resultDiv = jColorResultsDiv();
                reviewDiv = jColorResultsTable();
                break;
            case 'words':
                resultDiv = jWordsResultsDiv();
                reviewDiv = jWordsResultsTable();
                break;
            default:
                break;
        }

        let container = $("<div class='container'></div>").append(
                $("<h2></h2>").html("Result")
                , resultDiv
                , tryAgainBtn
                , settingsAgainBtn
                , reviewDiv
                , recallTimeDiv
            );
        $("#mainLayout").empty().append(container);
        window.scrollTo(0,0);
    }

    // when results are entered and ready to proceed to "check results" layout
    function onResultsEntered() {
        stopTimer(Game.gameTimer);
        Game.setup.recallEndMs = (new Date()).getTime();
        switch (Game.setup.event) {
            case 'numbers':
            case 'binary':
            case 'spoken':
                if (Game.setup.recallMethod == 1) {
                    Game.setup.inputArr = "";

                    let groupBy = Game.setup[
                        (Game.setup.event == 'spoken') ? 'displayNumBy' : 'groupBy'];
                    let nGroups = MemoEngine.groupsInSeq(Game.setup, groupBy);
                    let groupSize = MemoEngine.groupSize(groupBy);
                    $.each($("input.digitAns"), function (index, el) {
                        Game.setup.inputArr += (index == nGroups-1)
                            ? $(this).val()
                            : completeToLength($(this).val(), groupSize);
                    });
                } else {
                    // including recallMethod = 0
                    Game.setup.inputArr = $("#userAnswer").val();
                }
                break;
            case 'color':
                Game.setup.inputArr = [];
                for (let i = 0; i < Game.setup.seq.length; ++i)
                    Game.setup.inputArr.push($("input.colorAns")[i].value);
                break;
            case 'words':
                Game.setup.inputArr = [];
                for (let i = 0; i < Game.setup.seq.length; ++i)
                    Game.setup.inputArr.push($("input.wordAns[data-index='"+i+"']").val());
                break;
            default:
                Game.setup.inputArr = ['?', '?', '?'];
                break;
        }
        loReview();
    }

    // displays distraction screen
    function loDistraction() {
        onTitleChange(MemoEngine.eventTitle(Game.setup.event));
        if (Game.setup.distractionTime == 0)
            return onDistractionOver();

        // 60 sec for distraction screen
        Game.distractionStartMs = (new Date()).getTime();
        Game.gameTimer = setInterval(updateDistractionScreen, 10);
        let getReadyText = $("<div class='h2'></div>").html(tr("Recall starts in"));
        let timerDiv = $("<div class='h1' id='distractionTimer'></div>");
        let skipBtn = $("<button class='btn btn-outline-primary' disabled></button>")
            .html(tr('Skip')).click(onDistractionOver);

        $("#mainLayout").empty().append(getReadyText, timerDiv, skipBtn);
        setTimeout(function () {
            skipBtn.attr('disabled', false).focus();
        }, 500)
    }

    // set layout to "input results"
    function loRecall() {
        onTitleChange(MemoEngine.eventTitle(Game.setup.event) + ": " + tr("recall"));
        Game.setup.recallStartMs = (new Date()).getTime();
        unbindGameKeyDown();

        let preText = $("<div class='text-left'><i class='fa fa-stopwatch'></i> <b>"
                +getMemoTimeText()+"s</b><br><i class='fa fa-edit'></i> <span id='recallTimePh'></span></div>");
        let inputDiv = $("<div></div>");

        inputStatusChanged = function () {
            let inputtedNumber = $("#userAnswer").val().replace(/[\s\n\r]+/g, '').length;
            $("#inputStatus").html(inputtedNumber + "/" + Game.setup.seq.length);
        }

        // [numbers, binary, words, spoken, images, letters, faces, color]
        switch (Game.setup.event) {
            case 'numbers':
            case 'binary':
            case 'spoken':
                if (Game.setup.recallMethod == 1) {
                    let groupBy = Game.setup[
                        (Game.setup.event == 'spoken') ? 'displayNumBy' : 'groupBy'];
                    let numGroups = MemoEngine.groupsInSeq(Game.setup, groupBy);
                    let groupSize = MemoEngine.groupSize(groupBy);
                    ol = $("<ol></ol>");
                    for (let gr = 0; gr < numGroups; gr++) {
                        gotoNextInput = function (index) {
                            nextInput = $("input[data-index='"+(index+1)+"']");
                            if (index == (numGroups-1)) {
                                $("button#finishRecall").focus();
                            } else if (nextInput.length) {
                                nextInput.focus();
                            }
                        }
                        let inp = $("<input type='number' class='digitAns form-control' data-index='"+gr+"'/>")
                            .attr('max', Math.pow(10, groupSize)-1)
                            // go to next input when finished current field
                            .on('keyup', function (event) {
                                let key = (event.keyCode ? event.keyCode : event.which);
                                let thisIndex = Number.parseInt($(this).attr('data-index'));
                                nextInput = $("input[data-index='"+(thisIndex+1)+"']");
                                if ($(this).val().length == groupSize && isEventKeyNumeric(key) && nextInput.val() == "")
                                    gotoNextInput(thisIndex);
                            })
                            // override arrow keys behaviour: switch between fields
                            .on('keydown', function (event) {
                                let key = (event.keyCode ? event.keyCode : event.which);
                                let thisIndex = Number.parseInt($(this).attr('data-index'));
                                if ([13, 38, 40, 74, 75].includes(key))
                                    event.preventDefault();
                                if (key == 13 || key == 40 || key == 74) // but when press NOT ENTER goto nex anyway!!
                                    gotoNextInput(thisIndex);
                                // previous
                                if ((key == 38 || key == 75) && thisIndex > 0)
                                    $("input[data-index='"+(thisIndex-1)+"']").focus();
                            });

                        ol.append($("<li></li>").append(inp));
                    }
                    inputDiv.append( $("<div class='container'></div>").append(ol) );
                    setTimeout(function () {$("input[data-index='0']").focus();}, 100);
                } else {
                    // for recallMethod=0 and others
                    inputDiv.append(
                          $("<textarea id='userAnswer' class='form-control'></textarea>")
                            .attr('rows', 10)
                            .keyup(inputStatusChanged).change(inputStatusChanged)
                            .attr('placeholder', tr('Enter memorized here'))
                        , $("<div id='inputStatus'></div>")
                            .html("0/" + Game.setup.seq.length)
                            .css('text-align', 'left')
                    );
                    setTimeout( function () {$("#userAnswer").focus();}, 100);
                }
                break;
            case 'words':
                ol = $("<ol></ol>");
                for (let i = 0; i < Game.setup.seq.length; ++i) {
                    let inp = $("<input type='text' class='wordAns form-control' data-index='"+i+"'/>")
                        .on('keydown', function (event) {
                            let key = (event.keyCode ? event.keyCode : event.which);
                            let thisIndex = Number.parseInt($(this).attr('data-index'));
                            if (key == 13 || key == 40) {
                                if (thisIndex == (Game.setup.seq.length-1)) {
                                    $("button#finishRecall").focus();
                                } else {
                                    $("input[data-index='"+(thisIndex+1)+"']").focus();
                                }
                            } else if (key == 38 && thisIndex > 0) {
                                $("input[data-index='"+(thisIndex-1)+"']").focus();
                            }
                        });
                    ol.append($("<li></li>").append(inp));
                }
                inputDiv.append( $("<div class='container'></div>").append(ol) );
                setTimeout(function () {$("input[data-index='0']").focus();}, 100);
                break;
            case 'color':
                ol = $("<ol></ol>");
                for (let i = 0; i < Game.setup.seq.length; ++i)
                    ol.append($("<li><input class='colorAns' type='color'/></li>"));
                inputDiv.append(ol);
                break;
            default:
                break;
        }

        let nextBtn = $("<button class='btn btn-primary form-control'></button>")
            .attr('id', 'finishRecall')
            .html(tr('Submit'))
            .click(onResultsEntered);
        let container = $("<div class='container'></div>").append(preText, inputDiv, nextBtn);
        $("#mainLayout").empty().append(container);

        // do we use this timer to update recall? 
        Game.gameTimer = setInterval(updateRecallTime, 10);
    }


    // set Game layout
    function loGame() {
        Game.setup.currentIndex = 0;
        bindGameKeyDown();

        // place on the screen
        let itemContainer = $("<div id='itemContainer' class='centered'></div>")
            .tclick(function () {Game.setup.hintOnClick ? displayHint() : onShowNextElement();})
            .css('cursor','pointer');
        let progressbarDiv = $("<div id='gameProgressBar' class='progress-bar' role='progressbar'></div>")
            .attr('aria-valuemin', 0)
            .attr('aria-valuemax', MemoEngine.groupsInSeq(Game.setup))
            .attr('aria-valuenow', 0)
            .width('0%')
            .height('2px');
        let progress = $("<div class='progress'></div>").append(progressbarDiv).height('2px');
        let positionDiv = $("<div id='positionDiv'></div>");
        let controlsPanel = MemoEngine.controlsPanel(
                Game.setup,
                onShowPrevElement,
                onShowNextElement,
                onShowFirstElement,
                onFinishMemorizing);
        let memoTable = jqMemoTable();

        $("#mainLayout").empty().append(
            progress
            , itemContainer
            , memoTable
            , positionDiv
            , "<hr/>"
            , controlsPanel
        );

        // start immidiately
        resetFlashInterval();
        makeAflash();

        // measure time
        Game.setup.memoStartMs = (new Date()).getTime();
        Game.setup.recallStartMs = null;
        Game.memoTimeTimer = setInterval(updateMemoTime, 15);
    }

    // updates "memorization time" label during the game
    function updateMemoTime() {
        if ((Game.setup.event == 'spoken'))
            return;
        // check if memoTimeTimer is expired
        if ($("#itemContainer").length == 0)
            return stopTimer(Game.memoTimeTimer);

        let timeLimit = Game.setup.timeLimit;
        let msToDisplay = (timeLimit == 0)
            ? (new Date()).getTime() - Game.setup.memoStartMs
            : Game.setup.memoStartMs + toMilli(timeLimit) - (new Date()).getTime();
        let timeEmoji = (timeLimit == 0) ? "&#9201;" : "&#9200;";

        // display time on top bar
        onTitleChange(timeEmoji + " " + msToHumanReadable(msToDisplay, false));

        // when time is up: go to recall stage
        if (timeLimit > 0 && msToDisplay < 0) {
            stopTimer(Game.memoTimeTimer);
            loDistraction();
        }
    }

    // updates "recall time" label during the game
    function updateRecallTime() {
        // check if memoTimeTimer is expired
        if ($("span#recallTimePh").length == 0)
            return stopTimer(Game.gameTimer);

        let timeLimit = Game.setup.recallTimeLimit;
        let msToDisplay = (timeLimit == 0)
            ? (new Date()).getTime() - Game.setup.recallStartMs
            : Game.setup.recallStartMs + toMilli(timeLimit) - (new Date()).getTime();
        // let timeEmoji = "&#9997;";

        // display time
        let recallTimeSpan = $("span#recallTimePh");
        recallTimeSpan.html(msToHumanReadable(msToDisplay, false));
        let secondsToWarn = 10;
        if (timeLimit > 0 && msToDisplay < secondsToWarn*1000 && !recallTimeSpan.hasClass('alert-warning')) {
            recallTimeSpan.addClass('alert-warning');
            // ticking 10 times
            MemoEngine.playTickingSound(true); // first time - play immidiately
            var ticksPassed = 1;
            var tickingInterval = setInterval(function () {
                MemoEngine.playTickingSound(true);
                if (++ticksPassed === secondsToWarn)
                    window.clearInterval(tickingInterval);
            }, 1000)
        }

        // when time is up: go to recall stage
        if (timeLimit > 0 && msToDisplay < 0) {
            recallTimeSpan.html("Time\'s up!");
            onResultsEntered();
        }
    }

    // updates how many seconds to game start remained
    function updateGetReadyScreen() {
        // check if getready screen expired
        if ($("div#getReadyTimer").length == 0) {
            stopTimer(Game.gameTimer);
        }
        const msToGetReady = Game.setup.concentrationTime * 1000; // how much ms we need to get ready before game start
        let timeLeft = msToGetReady - getTimeDiff(Game.getReadyStartMs);
        let timeToDisplay = Math.ceil(timeLeft / 1000);

        if (timeLeft > 0) {
            let oldHtml = $("div#getReadyTimer").html();
            $("div#getReadyTimer").html(timeToDisplay);
            if (oldHtml != $("div#getReadyTimer").html())
                MemoEngine.playTickingSound(Game.setup.getReadyTick);
        } else {
            onGetReadyOver();
        }
    }

    function updateDistractionScreen() {
        // check if getready screen expired
        if ($("div#distractionTimer").length == 0)
            return onDistractionOver();
        const msToGetReady = Game.setup.distractionTime * 1000; // how much ms we need to get ready before game start
        let timeLeft = toMilli(Game.setup.distractionTime) - getTimeDiff(Game.distractionStartMs);
        let timeToDisplay = Math.ceil(timeLeft / 1000);

        if (timeLeft > 0) {
            $("div#distractionTimer").html(timeToDisplay);
        } else {
            onDistractionOver();
        }
    }

    // when distarction stage is over TODO stopped here
    function onDistractionOver() {
        stopTimer(Game.gameTimer);
        loRecall();
    }

    // when "get ready" time up OR user skipped waiting
    function onGetReadyOver() {
        stopTimer(Game.gameTimer);
        loGame();
    }

    // set layout to "get ready"
    function loGetReady() {
        onTitleChange("Memo sim");
        // 3..2..1 countdown timer
        Game.getReadyStartMs = (new Date()).getTime();
        Game.gameTimer = setInterval(updateGetReadyScreen, 10);
        let getReadyText = $("<div class='h2'></div>").html(tr("Get ready"));
        let timerDiv = $("<div class='h1' id='getReadyTimer'></div>");
        let skipBtn = $("<button class='btn btn-outline-primary'></button>").html(tr('Skip')).click(onGetReadyOver);
        lo = $("<div></div>").append(getReadyText, timerDiv, skipBtn);

        $("#mainLayout").empty().append(lo);
        skipBtn.focus();

        // save settings, generate sequence
        Game.setup.seq = null;
        Game.setup.inputArr = null;
        saveLocal('Game-' + Game.setup.event, JSON.stringify(Game.setup));
        Game.setup.seq = MemoEngine.generateSequence(Game.setup);
    }

    // starts gameplay
    function loSettings(setup = null) {
        // clearInterval(Game.gameTimer); // TODO do we need this here?
        onTitleChange(MemoEngine.eventTitle(setup.event));

        if ((setup.event) && (!setup.numItems)) // event is specified but everything else is not
            setup = Game.setup = Game.defaultSetup(setup.event);

        let startBtn = $("<button class='btn btn-primary form-control' id='startGetReady'></button>")
            .html(tr('Start'))
            .click(function () {
            Game.setup = Game.setupToJson($("#gameSetup"));
            loGetReady();
        });

        let card = $("<div class='card'></div>").append(
            $("<div class='card-body'></div>").append(
                $("<h5 class='class-title'>"+MemoEngine.eventTitle(setup.event)+"</div>")
                , jqSettings(setup)
                , startBtn
            )
        );
        $("#mainLayout").empty().append(card);
        $("input[type='number']").trigger('change').inputSpinner();
        SetupLay.doEventPreparations(Game.setup);
        startBtn.focus();
    }

    //                                                                            misc functions

    // returns string with memorization time in ss.cc format, e.g. 27.85
    function getMemoTimeText() {
        if (Game.setup.memoStartMs === null) {
            console.error("getMemoTimeText: memoStartMs == null");
            return '??.??';
        }
        let memoTimeMs = 0;
        if (Game.setup.recallStartMs === null) {
            console.warn("getMemoTimeText: recall hasnt started yet!");
            memoTimeMs = (new Date()).getTime() - Game.setup.memoStartMs;
        } else {
            memoTimeMs = Game.setup.recallStartMs - Game.setup.memoStartMs;
        }

        return msToHumanReadable(memoTimeMs);
    }
    // clears "makeAflash" interval and sets a new one
    function resetFlashInterval() {
        clearInterval(Game.gameTimer);
        if (Game.setup.interval != 0)
            Game.gameTimer = setInterval(makeAflash, toMilli(Game.setup.interval));
    }

    // in-game events

    // triggered "show next element now"
    function onShowNextElement() {
        resetFlashInterval();
        makeAflash();
        return;
    }
    // triggered "finish memo now"
    function onFinishMemorizing() {
        // for spoken numbers, trim input array so that when you input numbers you see how much you need to input
        if (Game.setup.event === 'spoken')
            Game.setup.seq = Game.setup.seq.slice(0, Game.setup.currentIndex);

        Game.setup.currentIndex = Game.setup.seq.length;
        makeAflash();
        return;
    }
    function onShowPrevElement() {
        resetFlashInterval();
        Game.setup.currentIndex = Math.max(0, Game.setup.currentIndex - 2);
        makeAflash();
    }
    function onShowFirstElement() {
        resetFlashInterval();
        Game.setup.currentIndex = 0;
        makeAflash();
        return;
    }

    // displayHint: in loGame, places HINT for current group into the item container
    // hint is a text description for the items, i.e. words for digits
    function displayHint() {
        let gameEvent = Game.setup.event;
        if (gameEvent == 'spoken') {
                let groupIndex = MemoEngine.itemIndexToGroupIndex(
                          Game.setup.displayNumBy
                        , Game.setup.currentIndex);
                let audioGroup = MemoEngine.getGroup(gameEvent
                        , Math.max(0, groupIndex - 1)
                        , Game.setup.seq
                        , Game.setup.displayNumBy);
                let audioGroupPrev = MemoEngine.getGroup(gameEvent
                        , Math.max(0, groupIndex - 2)
                        , Game.setup.seq
                        , Game.setup.displayNumBy);
                let img = MnemonicEngine.img(audioGroup);
                if (audioGroup != audioGroupPrev)
                    img = MnemonicEngine.img(audioGroupPrev) + "<br>" + img;
                if (img) {
                    $("#itemContainer").html($("<div class='h3'></div>").html(img));
                    resetFlashInterval();
                }
        } else if (gameEvent == 'numbers') {
            let digits = $("#memoElemWrap").html();
            let img = MnemonicEngine.img(digits);
            if (img) {
                $("#memoElemWrap").html($("<div class='h3'></div>").html(img));
                setTimeout(function (){$("#memoElemWrap").html(digits);}, 1000);
                resetFlashInterval();
            }
        }
    }

    // keydown diring GAME. Should bind this to document when game starts and unbind when it ends
    function gameKeyDown(event) {
        let key = (event.keyCode ? event.keyCode : event.which);
        let gameEvent = Game.setup.event;
        // check if key bind is expired and unbind
        if (!Game.setup
                || ($("#itemContainer").length == 0)
                || (Game.setup.currentIndex === null)
                || (Game.setup.currentIndex > Game.setup.seq.length)
                ) {
            unbindGameKeyDown();
            return;
        }
        if (gameEvent == 'spoken') {
            if (key == 13 || key == 32)
                onFinishMemorizing();
            else if (key == 16 && Game.setup.hintOnClick) // 'shift': display hint
                displayHint();
            return; // no more possible keypresses for this event
        }
        switch (key) {
            case 13: // enter
                return onFinishMemorizing();
            case 76: // l (vim-like right)
            case 39: // arrow right
            case 32: // space
                return onShowNextElement();
            case 72: // h (vim-like left)
            case 37: // arrow left
                return onShowPrevElement();
            case 38: // key up: return to the beginning
            case 36: // "Home"
                return onShowFirstElement();
            case 35: // 'end' btn to last element
                resetFlashInterval();
                Game.setup.currentIndex = Game.setup.seq.length - 1;
                makeAflash();
                return;
            case 16: // 'shift': display hint
                if (Game.setup.hintOnClick)
                    displayHint();
                return;
        }
    }
    // bind keydown handler to document
    function bindGameKeyDown() { $(document).on('keydown', gameKeyDown); }
    function unbindGameKeyDown() {$(document).off('keydown', gameKeyDown); }
}

// param div - div that contains all setup inputs and labels
// if some fields are not in div, gets setup from default setup
Game.setupToJson = function(div) {
    // switch name
    let event = div.find("input[type=hidden]#eventName").val();
    let s = Game.defaultSetup(event);

    let inputs = {
        'event': div.find("input[type=hidden]#eventName"),
        'numItems': div.find("input[type=number]#numItems"),
        'timeLimit': div.find("select#timeLimit"),
        'recallTimeLimit': div.find("select#recallTimeLimit"),
        'distractionTime': div.find("select#distractionTime"),
        'concentrationTime': div.find("select#concentrationTime"),
        'interval': div.find("input[type=number]#interval"),
        'groupBy': div.find("input#groupBy"),
        'displayNumBy': div.find("input#displayNumBy"),
        'textClass': div.find("select#textClass"),
        'spokenVoice': div.find("select#spokenVoice"),
        'hintOnClick': div.find("input[type=checkbox]#hintOnClick"),
        'getReadyTick': div.find("input[type=checkbox]#getReadyTick"),
        'recallMethod': div.find("select#recallMethod"),
        'dictionary': div.find("select#dictionary"),
    }
    for (let name in inputs) {
        let input = inputs[name];
        if (input.length) {
            let value = (input.attr('type') == 'checkbox' ? input.is(':checked') : input.val());
            if (value !== "")
                s[name] = value;
        }
    }
    return s;
};

// returns JSON object with default setup for specific event.
// If previously saved the supet locally, returns saved
// param e - event name
Game.defaultSetup = function (e = 'numbers') {
    let s = {
        'event': e,
        'numItems': 5,
        'interval': 0,
        'groupBy': 1,
        'timeLimit': 0,
        'concentrationTime': 3,
        'distractionTime': 10,
        'recallTimeLimit': 0,

        'alternateBg': true,
        'textClass': 'display-2',
        'displayTable': true,
        'hintOnClick': false,
        'getReadyTick': false,

        // event-specific
        'dictionary': 'en-nouns-top1k',
        'spokenVoice': 'female',
        'displayNumBy': '1',
        'recallMethod': 0,

        // in-game
        'memoStartMs':  null,
        'recallStartMs':  null,
        'recallEndMs':  null,
    };

    switch (e) {
    case "numbers":
        s.numItems = 80;
        s.groupBy = 3;
        s.textClass = 'display-1';
        break;
    case "words":
        s.numItems = 15;
        s.groupBy = 1;
        s.textClass = 'display-word';
        break;
    case "binary":
        s.numItems = 100;
        s.groupBy = '5';
        s.textClass = 'display-3';
        break;
    case "spoken":
        s.numItems = 100;
        s.groupBy = 1;
        s.interval = 1;
        s.displayTable = false;
        s.getReadyTick = true;
        s.timeLimit = 0;
        break;
    case "color":
        s.numItems = 5;
        break;
    case "images":
        s.numItems = 30;
        s.interval = 0;
        break;
    }

    // check localstorage and whether all fields are in there
    let fromLocal = loadLocal('Game-' + e, null);
    if (fromLocal) {
        let localSettings = JSON.parse(fromLocal);
        // if some field isn't in local settings (e.g. it was added in newer version), override it with default (s)
        for (var property in s) {
            if (!localSettings.hasOwnProperty(property) || localSettings[property] === null)
                localSettings[property] = s[property];
        }
        return localSettings;
    }

    return s;
}

Game.setup = null;

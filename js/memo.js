// common functions for memory sports events

// generates memory sports item
// numbers, binary, words, images, letters, faces]
function MemoEngine () {}
MemoEngine.tickingSound = new Audio('sounds/digits_sounds/tick.wav');
MemoEngine.tickingSound.preload = true;

MemoEngine.indexOfWord = 0;
MemoEngine.generateItem = function(setup) {
    switch (setup.event) {
        case 'spoken': return randomDigitsString(1, false);
        case 'numbers': return randomDigitsString(1, false);
        case 'binary': return randomDigitsString(1, true);
        case 'words': {
            MemoEngine.indexOfWord++;
            if (MemoEngine.indexOfWord >= WordsEngine.currentDict.length) {
                MemoEngine.indexOfWord = 0;
                shuffle(WordsEngine.currentDict);
            }
            return WordsEngine.currentDict[MemoEngine.indexOfWord];
        }
        case 'color': return tinycolor.random();
        case 'images': return MemoEngine.memoImgElement(MemoEngine.imagesArray[MemoEngine.imagesIndex++]);
        default: return null;
    }
}

MemoEngine.eventTitle = function (event) {
    switch (event) {
        case 'numbers': return tr('Numbers');
        case 'binary': return tr('Binary digits');
        case 'words': return tr('Words');
        case 'color': return tr('Colors');
        case 'spoken': return tr('Spoken numbers');
        case 'images': return tr('Images');
        default: return (event + '- MemoEngine.eventTitle not set');
    }
}

// returns elements sequence for memorization
MemoEngine.generateSequence = function(setup) {
    let result = [];
    let kNumAttempts = 5;
    for (let i = 0; i < setup.numItems; ++i) {
        let item = MemoEngine.generateItem(setup);
        result.push(item);
    }
    return result;
}

// mode, places item into container div (jquery object).
// \param setup - game setup
MemoEngine.placeItemInContainer = function (item, container, setup) {
    switch(setup.event) {
        case 'numbers':
        case 'letters':
        case 'binary':
        case 'words':
            container.html( $("<h1 id='memoElemWrap'></h1>").html(item).addClass(setup.textClass) );
            break;
        case 'spoken':
            let imgDiv = $("<div class='display-1'></div>").html("🔊");
            container.html(imgDiv);
            MemoEngine.sayDigit(Number.parseInt(item));
            break;
        case 'images':
            container.html(item);
            break;
        case 'faces':
            container.html(nameFaceCardHtml(item));
            break;
        case 'color':
            container.html(MemoEngine.makeColorCardHtml(item));
            break;
        default: container.html("<h1>"+setup.event+" - ?</h1>");
    }
}

//  places item into memo-table mini div (jquery object).
// \param setup - game setup
MemoEngine.placeItemInElTable = function (item, div, setup) {
    switch(setup.event) {
        case 'numbers':
        case 'letters':
        case 'binary':
        case 'words':
            div.html(item);
            break;
        case 'spoken':
            div.html("");
            break;
        case 'images':
            // div.html($("<div class='memoImgPreview'></div>").append(item));
            div.html("&nbsp;");
            break;
        case 'faces':
            div.html("(" + item + ")");
            break;
        case 'color':
            let index = Number.parseInt(div.attr('data-index')) + 1;
            div.html("&nbsp;" + index + "&nbsp;").css('background-color', item);
            break;
        default: container.html("<h1>"+setup.event+" - ?</h1>");
    }
}

// returns string with group
// having game setup (sequence, group index, group by), returns items group (e.g. a 3-digit number)
// returns null if index is out of bounds
// seq - if default (setup.seq), get group from game setup sequence. Else from other array (e.g. from user input)
// groupSize: if default (setup.groupBy), get group according to setup, which is what you need in most cases.
MemoEngine.getGroup = function(event, groupIndex, seq, groupBy) {
    // suppose group is "4 3 4". First thing we do is sum up numbers
    let singleSeparator = (event == 'words') ? "<br>" : ""; // separates single items (like, digits in number)
    let separator = (event == 'words') ? "<br>" : " "; // local group separator
    let grArr = [];
    let groupSize = groupBy;
    if (Number.isInteger(groupBy)) {
        grArr = [groupBy]
    } else {
        groupBy.split(/\s+/).forEach(function (numStr) {
            numStr = Number.parseInt(numStr);
            grArr.push(numStr ? numStr : 1);
        });
        groupSize = sumOfElements(grArr);
    }

    let result = "";
    let begin = groupIndex * groupSize;
    if (begin >= seq.length)
        return null;
    let end = Math.min((groupIndex + 1) * groupSize, seq.length);
    // grArr = [4, 4]
    let i = begin;
    grArr.forEach(function (localGrSize) {
        for (let L = 0; L < localGrSize && i < end; L++, i++)
            result += seq[i] + ((L == localGrSize-1) ? "" : singleSeparator);
        result += separator;
    });
    return result;
}

// returns number of items in group based on \param groupBy.
// Example 1: groupBy = '3 2 3', returns 8
// Example 2: groupBy = '3', returns 3
MemoEngine.groupSize = function(groupBy) {
    if (Number.isInteger(groupBy))
        return groupBy;
    let grArr = [];
    groupBy.split(/\s+/).forEach(function (numStr) {
        numStr = Number.parseInt(numStr);
        grArr.push(numStr ? numStr : 1);
    });
    return sumOfElements(grArr);
}
// returns number of groups in sequence based on game setup
MemoEngine.groupsInSeq = function (setup, groupBy = setup.groupBy) {
    return Math.ceil(setup.seq.length / MemoEngine.groupSize(groupBy));
}

// convert index of item in sequence to index of corresponding group
// Example: seq = 'a,b,c,d,e,f,g'. GroupBy = '1 2'. That means, groups are: ["a bc", "d ef", "g"].
// For itemIndex = 3 (item 'd'), returns 1 (as the index of "d ef" group).
MemoEngine.itemIndexToGroupIndex = function (groupBy, itemIndex) {
    return Math.floor(itemIndex / MemoEngine.groupSize(groupBy));
}

// returns jquery object with color-card - a square colored in \param color
MemoEngine.makeColorCardHtml = function (color) {
    return $("<div class='colorCard'>&nbsp;</div>").css('background-color', color);
}

// caches voices in folder 'v'
MemoEngine.cacheVoices = function(v) {
    MemoEngine.numberOfCachedSounds = 0;
    $("button#startGetReady").attr('disabled', true);
    onTitleChange(tr('Loading...'));

    onDigitLoaded = function (event) {
        MemoEngine.numberOfCachedSounds++;
        if (MemoEngine.numberOfCachedSounds == 10) {
            onTitleChange(MemoEngine.eventTitle('spoken'));
            $("button#startGetReady").attr('disabled', false);
        } else {
            onTitleChange(tr('Loading') + MemoEngine.numberOfCachedSounds + "/10...");
            $("button#startGetReady").attr('disabled', true);
        }
        // play this digit on minimal volume to avoid mobile-device sound glitches / lazy initializations
        event.target.volume = 0.001;
        event.target.play();
    }
    // disable 'play' button in the beginning and enable it when all audios loaded
    MemoEngine.digitsSnd = [];
    for (var i = 0; i <= 9; i++) {
        let audio = new Audio("sounds/digits_sounds/" + v + "/" +i+".wav");
        audio.preload = true;
        audio.addEventListener("loadeddata", onDigitLoaded, true);
        MemoEngine.digitsSnd.push(audio);
    }
    return this;
}

// pre-loads voice sounds and plays random one
MemoEngine.testSpokenVoice = function () {
    if (MemoEngine.testDigitIndex == undefined)
        MemoEngine.testDigitIndex = 0;
    else
        MemoEngine.testDigitIndex = (MemoEngine.testDigitIndex+1)%10
    MemoEngine.sayDigit(MemoEngine.testDigitIndex);
    return this;
}

// plays sound from beginning
MemoEngine.sayDigit = function(digit) {
    let audio = MemoEngine.digitsSnd[digit];
    audio.currentTime = 0; // otherwise cases like "..., 5, 5, ..." would not work
    audio.volume = 1;
    audio.play();
    return this;
}

// TODO should not depend on gameSetup - transfer
// doPlay - if we really need to play it (otherwise just emit)
MemoEngine.playTickingSound = function(doPlay) {
    MemoEngine.tickingSound.currentTime = 0;
    MemoEngine.tickingSound.volume = (doPlay) ? 0.7 : 0.00001;
    MemoEngine.tickingSound.play();
}

// returns jquery obj for in-game control panel
MemoEngine.controlsPanel = function (setup, onShowPrevElement, onShowNextElement, onShowFirstElement, onFinishMemorizing) {
    if (setup.event == 'spoken')
        return $("<div class='container'></div>").append(
                $("<button class='btn btn-outline-danger col-10'></button>")
                .html(tr("ToFinish") + '<br><kbd>Enter</kbd> / <kbd>Space</kbd>')
                .tclick(onFinishMemorizing)
            );
    return $("<div></div>").append(
                $("<div class='container'></div>").append(
                    $("<button class='btn btn-outline-danger col-6'></button>")
                        .html(tr("ToFinish") + '<br><kbd>Enter</kbd>')
                        .tclick(onFinishMemorizing),
                    $("<button class='btn btn-outline-secondary col-6'></button>")
                        .html(tr('ToTheBegin')+'<br><kbd>&#8593;</kbd>')
                        .tclick(onShowFirstElement),
                ),
                $("<div class='container'></div>").append(
                    $("<button class='btn btn-outline-secondary col-6'></button>")
                        .html(tr("Back") + '<br><kbd>&#8592;</kbd>')
                        .tclick(onShowPrevElement),
                    $("<button class='btn btn-outline-secondary col-6'></button>")
                        .html(tr("Next") + '<br><kbd>&#8594;</kbd>')
                        .tclick(onShowNextElement),
                ),
        );
}

// preloads images for memo
MemoEngine.cacheImages = function(num=100) {
    MemoEngine.imagesCachedCount = 0;
    MemoEngine.imagesToCache = num;

    MemoEngine.imagesArray = [];
    MemoEngine.imagesIndex = 0;
    let onError = function (res) {
        onTitleChange(tr('error'));
        console.error(res);
    }
    let onUrlsReceived = function (res) {
        let imageWasLoaded = function () {
            MemoEngine.imagesCachedCount++;
            if (MemoEngine.imagesCachedCount >= MemoEngine.imagesToCache) {
                onTitleChange("Loaded");
                $("#startGetReady").attr('disabled', false);
            } else {
                onTitleChange(MemoEngine.imagesCachedCount + "/" + MemoEngine.imagesToCache);
                $("#startGetReady").attr('disabled', true);
            }
        }

        let splitted = res.split('\n');
        if (splitted.length < 2 || splitted[0] !== 'ok' || (Number.parseInt(splitted[1])+2) != splitted.length)
            return onError(res);
        splitted.splice(0, 2);
        console.log(splitted);
        splitted.forEach(function (url) {
            let img = new Image();
            img.onload = imageWasLoaded;
            img.src = url;
            MemoEngine.imagesArray.push(img)
        });
    }
    // sendPost("https://bestsiteever.ru/memo/api/getiamimages.php", "n=" + num, onUrlsReceived, onError);
    onUrlsReceived(MemoEngine.imgApiFakeResponse);
}

MemoEngine.memoImgElement = function(image) {
    return $("<img></img>").attr('src', image.src);
}


// temp todo delete
MemoEngine.imgApiFakeResponse =
"ok\n100\nhttps://bestsiteever.ru/memo/iam_images/acoustic-guitar-146262__480.png\nhttps://bestsiteever.ru/memo/iam_images/31-robot-763524__480.png\nhttps://bestsiteever.ru/memo/iam_images/beauty-157149__480 (2).png\nhttps://bestsiteever.ru/memo/iam_images/browse-1020064__480.png\nhttps://bestsiteever.ru/memo/iam_images/backgroumd-956625__480.png\nhttps://bestsiteever.ru/memo/iam_images/baby-1085667__480.png\nhttps://bestsiteever.ru/memo/iam_images/balance-154516__480.png\nhttps://bestsiteever.ru/memo/iam_images/bucket-303265__480.png\nhttps://bestsiteever.ru/memo/iam_images/animal-161424__480.png\nhttps://bestsiteever.ru/memo/iam_images/background-830014__480.png\nhttps://bestsiteever.ru/memo/iam_images/bistro-806288__480.png\nhttps://bestsiteever.ru/memo/iam_images/bulb-29564__480.png\nhttps://bestsiteever.ru/memo/iam_images/bin-160461__480.png\nhttps://bestsiteever.ru/memo/iam_images/box-159632__480.png\nhttps://bestsiteever.ru/memo/iam_images/box-1036976__480.png\nhttps://bestsiteever.ru/memo/iam_images/bison-820494__480.png\nhttps://bestsiteever.ru/memo/iam_images/backpack-145841__480.png\nhttps://bestsiteever.ru/memo/iam_images/baby-985942__480.png\nhttps://bestsiteever.ru/memo/iam_images/buddha-1161054__480.png\nhttps://bestsiteever.ru/memo/iam_images/avenue-957201__480.png\nhttps://bestsiteever.ru/memo/iam_images/apple-756386__480.png\nhttps://bestsiteever.ru/memo/iam_images/backpack-924589__480.png\nhttps://bestsiteever.ru/memo/iam_images/alien-807311__480.png\nhttps://bestsiteever.ru/memo/iam_images/art-1084443__480.png\nhttps://bestsiteever.ru/memo/iam_images/alcohol-1031713__480.png\nhttps://bestsiteever.ru/memo/iam_images/bill-1026817__480.png\nhttps://bestsiteever.ru/memo/iam_images/blouse-1133696__480.png\nhttps://bestsiteever.ru/memo/iam_images/birds-1093519__480.png\nhttps://bestsiteever.ru/memo/iam_images/box-829666__480.png\nhttps://bestsiteever.ru/memo/iam_images/art-1019939__480.png\nhttps://bestsiteever.ru/memo/iam_images/books-761992__480.png\nhttps://bestsiteever.ru/memo/iam_images/american-875988__480.png\nhttps://bestsiteever.ru/memo/iam_images/bicycle-953383__480.png\nhttps://bestsiteever.ru/memo/iam_images/baby-1085666__480.png\nhttps://bestsiteever.ru/memo/iam_images/architecture-798749__480.png\nhttps://bestsiteever.ru/memo/iam_images/abstract-994762__480.png\nhttps://bestsiteever.ru/memo/iam_images/arm-wrestling-1020225__480.png\nhttps://bestsiteever.ru/memo/iam_images/bill-1026963__480.png\nhttps://bestsiteever.ru/memo/iam_images/bird-982861__480.png\nhttps://bestsiteever.ru/memo/iam_images/background-1082671__480.png\nhttps://bestsiteever.ru/memo/iam_images/abstract-772540__480.png\nhttps://bestsiteever.ru/memo/iam_images/accessory-1031995__480.png\nhttps://bestsiteever.ru/memo/iam_images/award-155595__480.png\nhttps://bestsiteever.ru/memo/iam_images/book-862492__480.png\nhttps://bestsiteever.ru/memo/iam_images/bicycle-161315__480.png\nhttps://bestsiteever.ru/memo/iam_images/bread-751061__480.png\nhttps://bestsiteever.ru/memo/iam_images/bone-1129877__480.png\nhttps://bestsiteever.ru/memo/iam_images/13161444_1184915488207487_25006666_o.png\nhttps://bestsiteever.ru/memo/iam_images/boxing-919692__480.png\nhttps://bestsiteever.ru/memo/iam_images/bear-973863__480.png\nhttps://bestsiteever.ru/memo/iam_images/agree-937898__480.png\nhttps://bestsiteever.ru/memo/iam_images/bird-990321__480.png\nhttps://bestsiteever.ru/memo/iam_images/bookmark-1133851__480.png\nhttps://bestsiteever.ru/memo/iam_images/artwork-765924__480.png\nhttps://bestsiteever.ru/memo/iam_images/antique-1125467__480.png\nhttps://bestsiteever.ru/memo/iam_images/abstract-772547__480.png\nhttps://bestsiteever.ru/memo/iam_images/animals-35599__480.png\nhttps://bestsiteever.ru/memo/iam_images/architecture-1058107__480.png\nhttps://bestsiteever.ru/memo/iam_images/ant-162000__480.png\nhttps://bestsiteever.ru/memo/iam_images/abstract-921865__480.png\nhttps://bestsiteever.ru/memo/iam_images/bag-156780__480.png\nhttps://bestsiteever.ru/memo/iam_images/blue-1155475__480.png\nhttps://bestsiteever.ru/memo/iam_images/acer-pseudoplatanus-872215__480.png\nhttps://bestsiteever.ru/memo/iam_images/bride-2048487__480.png\nhttps://bestsiteever.ru/memo/iam_images/art-1027829__480.png\nhttps://bestsiteever.ru/memo/iam_images/billiards-800782__480.png\nhttps://bestsiteever.ru/memo/iam_images/battery-1926843__480.png\nhttps://bestsiteever.ru/memo/iam_images/54.png\nhttps://bestsiteever.ru/memo/iam_images/balloons-308419__480.png\nhttps://bestsiteever.ru/memo/iam_images/bison-160267__480 (2).png\nhttps://bestsiteever.ru/memo/iam_images/bunny-1010289__480.png\nhttps://bestsiteever.ru/memo/iam_images/anniversary-157248__480.png\nhttps://bestsiteever.ru/memo/iam_images/basketball-33696__480.png\nhttps://bestsiteever.ru/memo/iam_images/banana-769420__480.png\nhttps://bestsiteever.ru/memo/iam_images/apple-336015__480.png\nhttps://bestsiteever.ru/memo/iam_images/bikini-811919__480.png\nhttps://bestsiteever.ru/memo/iam_images/billiard-157924__480.png\nhttps://bestsiteever.ru/memo/iam_images/blouse-1133691__480.png\nhttps://bestsiteever.ru/memo/iam_images/books-42701__480.png\nhttps://bestsiteever.ru/memo/iam_images/blender-575445__480.png\nhttps://bestsiteever.ru/memo/iam_images/bike-1952731__480.png\nhttps://bestsiteever.ru/memo/iam_images/beach-1220059__480.png\nhttps://bestsiteever.ru/memo/iam_images/blue-976850__480.png\nhttps://bestsiteever.ru/memo/iam_images/bear-157750__480.png\nhttps://bestsiteever.ru/memo/iam_images/beaver-48437__480.png\nhttps://bestsiteever.ru/memo/iam_images/animal-160462__480.png\nhttps://bestsiteever.ru/memo/iam_images/battery-312747__480.png\nhttps://bestsiteever.ru/memo/iam_images/abstract-742372__480.png\nhttps://bestsiteever.ru/memo/iam_images/branch-988820__480.png\nhttps://bestsiteever.ru/memo/iam_images/birds-1220793__480.png\nhttps://bestsiteever.ru/memo/iam_images/brain-1132229__480.png\nhttps://bestsiteever.ru/memo/iam_images/angel-1099908__480.png\nhttps://bestsiteever.ru/memo/iam_images/beer-26722__480.png\nhttps://bestsiteever.ru/memo/iam_images/background-1182673__480.png\nhttps://bestsiteever.ru/memo/iam_images/brush-1054741__480.png\nhttps://bestsiteever.ru/memo/iam_images/beija-flor-1025272__480.png\nhttps://bestsiteever.ru/memo/iam_images/baseball-bat-788931__480.png\nhttps://bestsiteever.ru/memo/iam_images/boat-trip-1167057__480.png\nhttps://bestsiteever.ru/memo/iam_images/auto-957508__480.png\nhttps://bestsiteever.ru/memo/iam_images/auto-1020151__480.png";

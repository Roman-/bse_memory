// toggles night mode;
function toggleNightMode() {
    Glob.nightModeOn = (loadLocal('Glob.nightModeOn') == 'true');
    Glob.nightModeOn = !Glob.nightModeOn;
    saveLocal('Glob.nightModeOn', Glob.nightModeOn);
    if (Glob.nightModeOn)
        DarkReader.enable();
    else
        DarkReader.disable();
    if ($("#events-div").length > 0)
        loMain();
}

// main layout with memorysports events
function loMain() {
    onTitleChange(tr("BSE memory"));
    $("#mainLayout").empty();

    if ((new Date() - Glob.websiteOpened < 1 * 60 * 1000) && (true == loadLocal("showIntroMem", true)))
        $("#mainLayout").append(jqIntroMessage());

    let div = $("<div class='container' id='events-div'></div>").append("<h1>"+tr("Practice")+"</h1>").append(
            jqMemorySportsGames()
    ).css('text-align', 'left');
    $("#mainLayout").append(div);
}

function jqLanguage() {
    engDiv = $("<div></div>").addClass('card text-center clickable').append(
            $("<img></img>").attr('alt', 'russian').attr('src', 'img/flag-en.jpg').addClass("card-img-top"),
            $("<div></div>").addClass("card-body").append($("<p></p>").addClass("card-text").html("English"))
            ).click(function () {
                Glob.currentLocale = 'en';
                saveLocal('memolocale', Glob.currentLocale);
                loMain();
            });
    rusDiv = $("<div></div>").addClass('card text-center clickable').append(
            $("<img></img>").attr('alt', 'russian').attr('src', 'img/flag-ru.jpg').addClass("card-img-top"),
            $("<div></div>").addClass("card-body").append($("<p></p>").addClass("card-text").html("Русский"))
            ).click(function () {
                Glob.currentLocale = 'ru';
                saveLocal('memolocale', Glob.currentLocale);
                loMain();
            });
    let allDiv = $("<div class='row'></div>").append(
            $("<div class='col-sm-5 mx-auto'></div>").append(engDiv),
            $("<div class='col-sm-5 mx-auto'></div>").append(rusDiv)
            );
    return $("<div></div>").css('width', '95%').append(allDiv);
}

function loLanguage() {
    $("#mainLayout").empty().append(jqLanguage());
    onTitleChange("Language");
}

// returns div with intro message
function jqIntroMessage() {
    let alertDiv = $("<div></div>").addClass('alert alert-primary text-left');
    let div = $("<div></div>");
    div.append($("<h1 class='my-2'></h1>").append(tr('Another memory sports trainer?')));
    div.append($("<div></div>").append(tr('Yes. And this one is aimed to be THE BEST ONE for you.')));
    for (let i = 1; i <= 4; i++) {
        div.append($("<h2 class='mt-3'></h2>").append(tr("benefit" + i + "-header")));
        div.append($("<div></div>").append(tr("benefit" + i + "-body")));
    }
    dismissBtn = $("<button class='btn btn-primary mt-3'></button>")
        .html(tr('Start training!'))
        .click(function () {
            saveLocal("showIntroMem", false);
            alertDiv.hide();
            loMain();
        });
    div.append(dismissBtn);
    return alertDiv.append(div)
}


// returns jquery object with list of memory sports events
function jqMemorySportsGames() {
        "binary", "words", "spoken", "color"
    let events = [
        {
            name: "numbers",
        },
        {
            name: "binary",
        },
        {
            name: "words",
        },
        {
            name: "spoken",
        },
        /*
        {
            name: "images",
        },
        */
        {
            name: "color",
        },
    ];
    let ul = $("<ul class='list-group list-group-flush'></ul>");
    daynight = Glob.nightModeOn ? "night" : "day";
    events.forEach(function (e) {
        let li = $("<li class='list-group-item clickable'></li>")
            // .html("<i class='fa fa-"+e.icon+"'></i> &nbsp;" + MemoEngine.eventTitle(e.name)).click(function () {
            .html("<img src='img/events/"+e.name+"-"+daynight+".png' class='game-icon'> &nbsp;" + MemoEngine.eventTitle(e.name)).click(function () {
                let currentGame = new Game;
                currentGame.start({event: e.name});
            })
        ul.append(li);
    });
    return ul;
}

// set to main layout
function initMenu() {
    let items = [
        [tr("Trainers"), loMain],
        [tr("Night mode"), toggleNightMode],
        [tr("My images"), function () {(new MnemoBrowser).start()}],
        [tr("About"), loAbout],
    ]
    let ul = $("ul.navbar-nav").empty();

    items.forEach(function (item) {
        let name = item[0];
        let fun = item[1];
        let btn = $("<a class='nav-link clickable'></a>")
            .html(name).click(fun)
            .attr('data-toggle', 'collapse')
            .attr('data-target', '#navbarNav');
        let li = $("<li class='nav-item'></li>").append(btn)
        ul.append(li);
    });
}

function loAbout() {
    onTitleChange(tr("About BSE memory"));
    let div = $("<div class='p-2'></div>").append($("<p class='text-left'></p>").append(tr("about-text")));
    div.append(jqIntroMessage);
    div.append(jqLanguage);

    $("#mainLayout").empty().append(div);
}

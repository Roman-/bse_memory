// generates random integer number
// if one argument is given, generates number from 0 (inclusive) to argument1 upperBound (non-inclusive)
// if two numbers are given, generates random integer number from arg1 (inclusive) to arg2 (non-inclusive)
function randomNumber(n1, n2 = NaN) {
    if (isNaN(n2))
        return Math.floor(Math.random()*n1);
    else
        return n1 + Math.floor(Math.random()*(n2-n1));
}

// returns string of length \param len with random digits
function randomDigitsString(len, binary = false) {
    let upperBound = binary ? 2 : 10;
    let result = "";
    for (let i = 0; i < len; ++i)
        result += randomNumber(upperBound);
    return result;
}

// returns random element from array arr
function randomElement(arr) {
    return arr[ randomNumber(arr.length) ];
}

// returns array of numbers [0, 1, ..., len-1] randomly permuted
function randomPermutation(len) {
    let arr = [];
    for (let i = 0; i < len; i++)
        arr.push(i);
    // shuffle TODO in tests not used
    shuffle(arr);
    return arr;
}

// shuffles array in place. \param a an array containing the items.
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

// returns sum of all elements of array \param arr
function sumOfElements(arr) {
    let result = 0;
    arr.forEach(function (el) {
        result += el;
    });
    return result;
}

// returns difference in miliseconds between current time and eventStartMs
function getTimeDiff(eventStartMs) {
    return (new Date()).getTime() - eventStartMs;
}

// clears timeout
// t - timeout ID or something I dont know how it works in JS
function stopTimer(t) {
    if (t !== null)
        clearTimeout(t);
    t = null;
}

// outputs error message to console and returns null.
// Convinient to return this object from funcs
function yellError(msg) {
    console.error(msg);
    return null;
}

// converts seconds to milliseconds
function toMilli(sec) {
    return sec * 1000;
}

// converts string of numbers separated by ',' to array of numbers
function userInputToNumbersArray(input) {
    let strings = input.split(/[,\s]+/);
    let result = [];
    strings.forEach(function (s) {
        result.push(parseInt(s));
    });
    return result;
}

// converts time duration in milliseconds to human readable time string. E.g.
// displayZeroMinutes - if true, display minutes even if they equal to 0
function msToHumanReadable(duration, displayMs = true) {
    if (!Number.isFinite(duration))
        return "-";
    var milliseconds = parseInt((duration%1000)/10)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10 && (minutes > 0 || hours > 0)) ? "0" + seconds : seconds;
    milliseconds = (milliseconds < 10) ? "0" + milliseconds : milliseconds;

    hoursString = (hours == 0) ? "" : hours + ":";
    minutesString = (minutes == 0) ? "" : (minutes + ":");

    return hoursString + minutesString + seconds + (displayMs ? ("." + milliseconds) : "");
}

// returns color match between color strings a and b
// between 1 and 3. If completely screwed up, returns -3
function colorMatch(aString,bString) {
    // hsl model: hue 0-360, sat 0-100, l 0-100
    const maxDiff = 255*3;
    let a = tinycolor(aString).toRgb();
    let b = tinycolor(bString).toRgb();
    let rDiff = Math.abs(a.r - b.r);
    let gDiff = Math.abs(a.g - b.g);
    let bDiff = Math.abs(a.b - b.b);
    let totalDiff = rDiff + gDiff + bDiff;
    let diffScaled = 1 - (totalDiff / maxDiff); // 0-1
    let scaled010 = Math.round(diffScaled * 10);
    let score = scaled010 - 7;
    return (score < 0) ? -3 : score;
}

// returns true if event.keycode is numberic key on keyboard
function isEventKeyNumeric(key) {
    return (key >= 48 && key <= 57) || (key >= 96 && key <= 105);
}

// makes string length equal to newLength
function completeToLength(string, newLength) {
    string = string.trim();
    if (string.length >= newLength)
        return string.substring(0, newLength);
    return string.padEnd(newLength, '-');
}

// shows modal bootstrap dialog
// \param content: either string or jquery object
// fullscreen: display fullscreen modal
// TODO build by components instead of HTML string
function showBsModal(content, title = 'Info', fullscreen = false, id='newBsModal') {
    let addClass = fullscreen ?  'modal-full' : '';
    let div = $('<div class="modal" tabindex="-1" role="dialog" id="'+id+'"> <div class="modal-dialog '+addClass+'" role="document"> <div class="modal-content"> <div class="modal-header"> <h5 class="modal-title">'+title+'</h5> <button type="button" class="close" data-dismiss="modal" aria-label="Close"> <span aria-hidden="true">&times;</span> </button> </div> <div class="modal-body" id="currentModalBody"></div> <div class="modal-footer"> <button type="button" class="btn btn-secondary" data-dismiss="modal">'+tr('Close-dialog')+'</button> </div> </div> </div> </div>');
    div.modal('show').on('hidden.bs.modal', function () {
        $(this).remove(); // remove this dialog from html document
    });
    $("#currentModalBody").append( (typeof content === 'string') ? $("<p>" + content + "</p>") : content );
    return div;
};


/// \param onSuccess - function with one argument - response
/// \param onError - function with one argument - error string
function sendPost(url, params, onSuccess, onError = null) {
    if (!onError)
        onError = function (res) {console.error(res);}
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.timeout = 5000; // time in milliseconds
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                onSuccess(xhr.responseText);
            } else {
              onError("XMLHttpRequest status "+xhr.status+": " + xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        onError(xhr.statusText);
    };
    xhr.ontimeout = function (e) {
      onError("Connection timeout (" + (xhr.timeout / 1000) + " seconds)");
    };
    xhr.send(params);
}

// levenDist returns leven distance between two words
levenDist = function()
{function W(r,t,e,o,n){return r<t||e<t?e<r?e+1:r+1:o===n?t:t+1}return function(r,t){if(r===t)return 0;if(r.length>t.length){var e=r;r=t,t=e}for(var o=r.length,n=t.length;0<o&&r.charCodeAt(o-1)===t.charCodeAt(n-1);)o--,n--;for(var h=0;h<o&&r.charCodeAt(h)===t.charCodeAt(h);)h++;if(n-=h,0===(o-=h)||n<3)return n;var a,c,f,d,u,A,C,i,g,l,v,s,p=0,D=[];for(a=0;a<o;a++)D.push(a+1),D.push(r.charCodeAt(h+a));for(var E=D.length-1;p<n-3;)for(g=t.charCodeAt(h+(c=p)),l=t.charCodeAt(h+(f=p+1)),v=t.charCodeAt(h+(d=p+2)),s=t.charCodeAt(h+(u=p+3)),A=p+=4,a=0;a<E;a+=2)A=W(d=W(f=W(c=W(C=D[a],c,f,g,i=D[a+1]),f,d,l,i),d,u,v,i),u,A,s,i),D[a]=A,u=d,d=f,f=c,c=C;for(;p<n;)for(g=t.charCodeAt(h+(c=p)),A=++p,a=0;a<E;a+=2)C=D[a],D[a]=A=W(C,c,A,g,D[a+1]),c=C;return A}}();

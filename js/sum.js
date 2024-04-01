SumEngine = function (){}
SumEngine.allowCombo = false;
SumEngine.allDigits = [0,1,2,3,4,5,6,7,8,9];

// generalized version for +SIMPLE, -SIMPLE, +Bro, -Bro, +Friend, -Friend
// digit - what digit do we complement
// fallback - function f(digit) that we use if cant find digit specifically for the method.
// map - method map {A -> X}: so that A +/- X is THAT method
// allowed - array of allowed complements for the method
// returns array [int, boolean]: [DIGIT, did we really used required method]
SumEngine.nextDigitForMethod = function(digit, methodMap, allowed, fallback) {
    if (!methodMap.hasOwnProperty(digit)) {
        console.log("digit "+digit+"not in the method map");
        return [fallback(digit, allowed)[0], false];
    }
    let methodArray = methodMap[digit];
    // discard unallowed
    let allowedArr = array_intersection(methodArray, allowed);
    if (allowedArr.length == 0) {
        console.log("digit "+digit+" not allowed after intersection");
        return [fallback(digit, allowed)[0], false];
    }
    return [randomElement(allowedArr), true];
}

SumEngine.emergency = function(digit, allowed)  {
    console.warn("no digits for simple method: "+digit + " and allowed = ", allowed);
    return [0];
}

// returns preferred digit to add within single digit in BRO method
SumEngine.nextAddSimpleDigit = function(digit, allowed = SumEngine.allDigits) {
    // simpleMap {A -> X}: A+X is SIMPLE method
    const simpleMap = {
        0: [0,1,2,3,4,5,6,7,8,9],
        1: [0,1,2,3,  5,6,7,8  ],
        2: [0,1,2,    5,6,7    ],
        3: [0,1,      5,6      ],
        4: [0,        5        ],
        5: [0,1,2,3,4          ],
        6: [0,1,2,3            ],
        7: [0,1,2              ],
        8: [0,1                ],
        9: [0,                 ],
    };
    return SumEngine.nextDigitForMethod(digit, simpleMap, allowed, SumEngine.emergency);
}

// returns preferred digit to add within single digit in BRO method
SumEngine.nextSubSimpleDigit = function(digit, allowed = SumEngine.allDigits) {
    // simpleMap {A -> X}: A-X is SIMPLE method
    const simpleMapSub = {
        9: [0,1,2,3,4,5,6,7,8,9],
        8: [0,1,2,3,  5,6,7,8  ],
        7: [0,1,2,    5,6,7    ],
        6: [0,1,      5,6      ],
        5: [0,        5        ],
        4: [0,1,2,3,4          ],
        3: [0,1,2,3            ],
        2: [0,1,2              ],
        1: [0,1                ],
        0: [0,                 ],
    };
    return SumEngine.nextDigitForMethod(digit, simpleMapSub, allowed, SumEngine.emergency);
}

// returns preferred digit to add within single digit in BRO method
SumEngine.nextAddBroDigit = function(digit, allowed = SumEngine.allDigits) {
    // broMap {A -> X}: A+X is BRO method
    const broMap = {
        1: [4],
        2: [4, 3],
        3: [4, 3, 2],
        4: [4, 3, 2, 1]
    };
    return SumEngine.nextDigitForMethod(digit, broMap, allowed, SumEngine.nextAddSimpleDigit);
}

// returns preferred digit to add within single digit in BRO method
SumEngine.nextSubBroDigit = function(digit, allowed = SumEngine.allDigits) {
    // broMap {A -> X}: A-X is BRO method
    const broMapMinus = {
        8: [4],
        7: [4, 3],
        6: [4, 3, 2],
        5: [4, 3, 2, 1]
    };
    return SumEngine.nextDigitForMethod(digit, broMapMinus, allowed, SumEngine.nextSubSimpleDigit);
}

// returns preferred digit to add within single digit in BRO method
// digitIndex - index of the digit for which we're using the method
SumEngine.nextAddFriendDigit = function(digit, allowed = SumEngine.allDigits, digitIndex = 1) {
    // broMap {A -> X}: A+X is FRIEND method
    const friendMap = {
        9: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        8: [   2, 3, 4, 5,    7, 8, 9],
        7: [      3, 4, 5,       8, 9],
        6: [         4, 5,          9],
        5: [            5,           ],
        4: [               6, 7, 8, 9],
        3: [                  7, 8, 9],
        2: [                     8, 9],
        1: [                        9],
    };
    const comboMap = {
        8: [6],
        7: [6, 7],
        6: [6, 7, 8],
        5: [6, 7, 8, 9],
    }
    let fallback = SumEngine.allowCombo ? SumEngine.nextAddBroDigit : SumEngine.nextAddSimpleDigit;
    let map = SumEngine.allowCombo ? comboMap : friendMap;

    // can't use friend method for first digit because of overflow/underflow
    if (digitIndex == 0) {
        console.log("friend: fallback because index = 0 for digit " + digit);
        return [fallback(digit, allowed)[0], false];
    }

    return SumEngine.nextDigitForMethod(digit, map, allowed, fallback);
}

// returns preferred digit to add within single digit in BRO method
// digitIndex - index of the digit for which we're using the method
SumEngine.nextSubFriendDigit = function(digit, allowed = SumEngine.allDigits, digitIndex = 1) {
    // broMap {A -> X}: A-X is FRIEND method
    const friendMapMinus = {
        0: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        1: [   2, 3, 4, 5,    7, 8, 9],
        2: [      3, 4, 5,       8, 9],
        3: [         4, 5,          9],
        4: [            5,           ],
        5: [               6, 7, 8, 9],
        6: [                  7, 8, 9],
        7: [                     8, 9],
        8: [                        9],
    };
    const comboMapMinus = {
        1: [ 6],
        2: [ 6, 7],
        3: [ 6, 7, 8],
        4: [ 6, 7, 8, 9],
    }
    let fallback = SumEngine.allowCombo ? SumEngine.nextSubBroDigit : SumEngine.nextSubSimpleDigit;
    let map = SumEngine.allowCombo ? comboMapMinus : friendMapMinus;

    // can't use friend method for first digit because of overflow/underflow
    if (digitIndex == 0) {
        console.log("sub friend: digit index = 0 for digit ", digit);
        return [fallback(digit, allowed)[0], false];
    }

    return SumEngine.nextDigitForMethod(digit, map, allowed, fallback);
}

// method - method name (string)
// pm - plus or minus: '+' or '-'
SumEngine.getDigitWiseFunc = function(method, pm) {
    SumEngine.allowCombo = false;
    if (method == 'simple') {
        if (pm == '+')
            return SumEngine.nextAddSimpleDigit;
        else if (pm == '-')
            return SumEngine.nextSubSimpleDigit;
    }
    if (method == 'bro') {
        if (pm == '+')
            return SumEngine.nextAddBroDigit;
        else if (pm == '-')
            return SumEngine.nextSubBroDigit;
    }
    if (method == 'combo') {
        SumEngine.allowCombo = true;
        method = 'friend';
    }
    if (method == 'friend') {
        if (pm == '+')
            return SumEngine.nextAddFriendDigit;
        else if (pm == '-')
            return SumEngine.nextSubFriendDigit;
    }
    console.error("no method found", method);
}

// returns next summand for firstSummand (abakus arr. nubmer) based on digitwise function
// digitwise - function for next summand: f(digit, allowed, index)
// relaxDigitwise - method we use for the rest of the digits when current method was already used for some digits
// operation - +1 or -1
SumEngine.nextSummand = function(firstSummand, digitwise, allowed, relaxDigitwise, operation) {
    var aa = firstSummand.slice(0); // clone
    let len = aa.length;
    let result = new Array(len).fill(0); // [0, 0, ...] len times
    let methodsUsed = new Array(len).fill(''); // methods: current, fallback, relaxed

    // if there're only 1 digit, exclude '0' from 'allowed'
    if (len == 1 && (allowed.indexOf(0) !== -1))
        allowed = allowed.slice(1);
    // need to apply method at least once. When stillNeedMethod = false, with certain probability we use fallback method
    let stillNeedMethod = true;
    let traverseOrder = randomPermutation(len);
    for (let travInd = 0; travInd < len; travInd++) {
        let i = traverseOrder[travInd];
        let digit = aa[i];
        // console.log("__Working with digit #" + i + " = " + digit + "____");

        // console.log("working with digit #" + i + " = "+digit);

        let letsUseRelaxed = (!stillNeedMethod && (Math.random() < 0.5));
        let resultForDigit = (letsUseRelaxed) ?
              relaxDigitwise(digit, allowed, i)
            : digitwise(digit, allowed, i);

        // console.log("resultForDigit #" + i + " = "+digit+" is ", resultForDigit, " which is comp. " + resultForDigit[0]);

        // calculating result on the fly
        let resultDigit = aa[i] + (operation * resultForDigit[0]);
        // console.log("resultdigit = "+aa[i] +"+"+(operation * resultForDigit[0]) + " = ", resultDigit);
        // underflow/overflow control
        if (resultDigit < 0) {
            if (i == 0) {
                // bad underflow
                console.log("bad underflow capture");
                letsUseRelaxed = true;
                resultForDigit = relaxDigitwise(digit, allowed, i);
            } else {
                if (aa[i-1] == 0) {
                    console.log("underflow over digit capture");
                    letsUseRelaxed = true;
                    resultForDigit = relaxDigitwise(digit, allowed, i);
                }
            }
        }


        // calc result that affects other digits
        result[i] = resultForDigit[0];
        aa[i] += (operation * resultForDigit[0]);

        console.log("stage2: resultForDigit = ", resultDigit, ", aa["+i+"] = ", aa[i]);

        if (aa[i] < 0) {
            console.log("<0");
            if (i == 0) {
                console.error("unexpected underflow");
            } else {
                aa[i-1] -= 1;
                if (aa[i-1] < 0)
                    console.error("terrible terrible underflow");
                aa[i] += 10;
            }
        } else if (aa[i] > 9) {
            console.log(">9");
            if (i == 0) {
                console.error("well, an overflow");
            } else {
                aa[i-1] = (aa[i-1] + 1)%10;
                aa[i] -= 10;
                console.log("-= 10 = ", aa[i]);
            }
        }

        stillNeedMethod &= !resultForDigit[1]; // if we used method for this digit, no need for it anymore
        methodsUsed[i] = letsUseRelaxed ? '~' : (resultForDigit[1] ? 'V' : 'X');
    }
    $("#methodsUsed").html(methodsUsed.join(''));
    return result;
}

// returns number which is next summand for \param number
SumEngine.getNextSummand = function(method, plusMinus, number, spokesNumber) {
    let numMin = (spokesNumber == 1) ? 0 : Math.pow(10, spokesNumber - 1); // min number that we can get, inclusive
    let numMax = Math.pow(10, spokesNumber) - 1; // max number that we can get, inclusive
    console.log("getNextSummand called: ", method, plusMinus, number, numMin, numMax);

    if ((plusMinus == '+' && number == numMax) || (plusMinus == '-' && number == numMin))
        return 0;

    // decide on +- sign
    if (method == 'simple') {
        if (plusMinus == '+-') {
            if (number >= numMax * 0.7)
                plusMinus = '-';
            else if (number <= (1+numMin) * 1.2)
                plusMinus = '+';
            else
                plusMinus = (Math.random() < 0.5) ? "+" : "-";
        }
    } else if (method == 'bro') {
        if (plusMinus == '+-') {
            // if random non-zero and non-nine digit of the number is >= 5, do PLUS
            if (getRandomDigitNon09(number) >= 5)
                plusMinus = '-';
            else
                plusMinus = '+';
        }
    } else if (method == 'friend') {
        if (plusMinus == '+-') {
            plusMinus = (Math.random() < 0.5) ? "+" : "-";
            if (number%10 == 0)
                plusMinus = '-';
            else if (number%10 == 9 || (number <= 9))
                plusMinus = '+';
        }
    }

    let operation = (plusMinus == '+') ? 1 : -1;
    let digitwise = SumEngine.getDigitWiseFunc(method, plusMinus);
    // method we use for the rest of the digits when current method was already used for some digits
    let relaxDigitwise = SumEngine.getDigitWiseFunc(SumEngine.allowCombo ? 'bro' : 'simple', plusMinus);
    let aa = toDigitsArray(number, spokesNumber);
    let nextAa = SumEngine.nextSummand(aa, digitwise, SumEngine.allDigits, relaxDigitwise, operation);
    let next = arrToNumber(nextAa);

    next *= ((plusMinus == '+') ? 1 : -1);

    return next;
}

// generates summands sequence for speedsum/speedrows game
// TODO improve seq generator based on method etc.
SumEngine.generateSequence = function(method, plusMinus, spokesNumber, len) {
    let seq = [];
    let firstNumberMin = Math.pow(10, spokesNumber - 1); // minimum possible value of first, inclusive (1)
    let firstNumberMax = Math.pow(10, spokesNumber); // maximum possible value of first, non-inclusive (10)
    let reserveBound = Math.floor((firstNumberMax - firstNumberMin) * 0.25);

    result = randomNumber(firstNumberMin, firstNumberMax);
    if (method == 'simple') {
        // heuristics: have some space within first summand
        let result = 0; // result = first number.
        if (plusMinus == '-')
            result = randomNumber(firstNumberMin + reserveBound, firstNumberMax);
        else if (plusMinus == '+')
            result = randomNumber(firstNumberMin, firstNumberMax - reserveBound);
        else
            result = randomNumber(firstNumberMin, firstNumberMax);
    } else if (method == 'bro') {
        // '+': at least one digit is '1'-'4'
        // '-': at least one digit is '5'-'9'
        let firstNumberStr = '';
        for (let i = 0; i < spokesNumber; i++) {
            if (plusMinus == '+')
                firstNumberStr += randomNumber(1, 5);
            else if (plusMinus == '-')
                firstNumberStr += randomNumber(5, 9);
            else
                firstNumberStr += randomNumber(1, 9);
        }
        result = Number.parseInt(firstNumberStr);
    }

    seq.push(result);

    for (let i = 1; i < len; ++i) {
        let next = SumEngine.getNextSummand(method, plusMinus, result, spokesNumber);
        if (next == 0) {
            console.warn("broke sequence because next summand is 0", method, plusMinus, result, spokesNumber);
            break; // sequence ends on 0
        }

        seq.push(next);
        result += next;
    }
    return seq;
}

// haveing sequence of positive and negaive numbers, returns string with example, e.g. +4-5
SumEngine.sequenceJoined = function(seq, separator = ' ') {
    let res = '' + seq[0];
    for (let i = 1; i < seq.length; ++i) {
        let n = seq[i];
        res += (n < 0) ? n : ("+"+n);
    }
    return res;
}

// from number selects random digit that is not 0 or 9.
function getRandomDigitNon09(number) {
    let str = '' + number;
    let allowed = [];
    for (let i = 0; i < str.length; i++) {
        let s = str[i];
        if (s != '0' && s != '9')
            allowed.push(s);
    }
    if (allowed.length == 0)
        return str[0];
    return Number.parseInt(randomElement(allowed));
}

// on 'example!' button clicked
SumEngine.getExample = function() {
    // get method
    let method = $('input[name=method]:checked', '#methodGroup').val();
    let plusMinus = $('input[name=plusMinus]:checked', '#plusMinusGroup').val();
    let number = parseInt($("#srcNumber").val());
    let spokesNumber = parseInt($("#spokesNumber").val());
    let next = SumEngine.getNextSummand(method, plusMinus, number, spokesNumber);

    let result = number + next;

    let text = number + plusMinus + next + " = " + result;
    console.log(text, "|", method, plusMinus, number, spokesNumber);

    $("#example").html(number + plusMinus + next + " = " + result);
}

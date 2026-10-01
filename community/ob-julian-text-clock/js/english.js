const themeLang = ["Browser", "Light", "Dark"]

function getLanguageSpecificTime(hour, minute) {
    let timeText = "";

    if(minute === 0)
        timeText = `It is ${convertNumberToText(hour)} o'clock`;
    else if(minute <= 30)
        timeText = `It is ${convertNumberToText(minute)}_min past ${convertNumberToText(hour)}`;
    else
        timeText = `It is ${convertNumberToText(60 - minute)}_min to ${convertNumberToText(hour + 1)}`;

    return timeText;
}

const numberToText =  {
    0: "Twelve", //English is weird
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
    6: "Six",
    7: "Seven",
    8: "Eight",
    9: "Nine",
    10: "Ten",
    11: "Eleven",
    12: "Twelve",
    13: "One", //To prevent out of bounds
    15: "Quarter",
    20: "Twenty",
    25: "Twentyfive",
    30: "Half",
    35: "Twentyfive",
    40: "Twenty",
    45: "Quarter",
    50: "Ten",
    55: "Five",
};

const specialCases = {
    "o'clock": "oclock"
}
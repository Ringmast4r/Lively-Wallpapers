const themeLang = ["Browser", "Hell", "Dunkel"];

let lastTime = "";

function getLanguageSpecificTime(hour, minute) {
    let timeText = "";
  
    if(minute === 0)
        if(hour === 1)
            timeText = `Es ist Ein Uhr`;
        else
            timeText = `Es ist ${convertNumberToText(hour)} Uhr`;
    else if(minute === 15)
        timeText = `Es ist Viertel nach ${convertNumberToText(hour)}`;
    else if(minute === 25)
        timeText = `Es ist fünf_min vor halb ${convertNumberToText(hour + 1)}`;
    else if(minute === 30)
        timeText = `Es ist halb ${convertNumberToText(hour + 1)}`;
    else if(minute === 35)
        timeText = `Es ist fünf_min nach halb ${convertNumberToText(hour + 1)}`;
    else if(minute === 45)
        // prevent text change if refreshing at wrong time or after scene switch
        if(lastTime === `Es ist Dreiviertel ${convertNumberToText(hour + 1)}.split` || lastTime === `Es ist Viertel vor ${convertNumberToText(hour + 1)}`)
            return lastTime;
        // flip coin for how to say it
        else if(Math.random() < 0.5)
            timeText = `Es ist Viertel vor ${convertNumberToText(hour + 1)}`;
        else
            timeText = `Es ist Dreiviertel ${convertNumberToText(hour + 1)}`;
    else if(minute < 30)
        timeText = `Es ist ${convertNumberToText(minute)}_min nach ${convertNumberToText(hour)}`;
    else
        timeText = `Es ist ${convertNumberToText(60 - minute)}_min vor ${convertNumberToText(hour + 1)}`;
    
    
    return timeText;
}

const numberToText = {
    0: "Zwölf", //Hust Hust 12 Uhr = 0 Uhr Hust Hust
    1: "Eins",
    2: "Zwei",
    3: "Drei",
    4: "Vier",
    5: "Fünf",
    6: "Sechs",
    7: "Sieben",
    8: "Acht",
    9: "Neun",
    10: "Zehn",
    11: "Elf",
    12: "Zwölf",
    13: "Eins", //Hust Hust 13 Uhr = 1 Uhr Hust Hust
    20: "Zwanzig",
};

const specialCases = {
    "dreiviertel": "drei_min viertel"
}
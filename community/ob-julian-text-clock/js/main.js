let lastTimeAsText = [];
let activeInterval;
let activeTimeout;
let updating = false;
let changeing = false;
let show = 0; // 0 = time, 1 = time, 2 = am/pm
const maxShow = 2;
const languages = ["german", "english"];
const themes = ["browser", "light", "dark"];

// lets check if the language.js is loaded correctly
if (typeof getLanguageSpecificTime !== "function" || typeof numberToText !== "object" || typeof specialCases !== "object") {
    console.error("language.js is not loaded correctly");
}

function isAM() {
    const now = new Date();
    return now.getHours() < 12;
}

function compareArrays(array1, array2) {
    return array1.filter(function(item) {
      return !array2.includes(item);
    });
}

function changeCssClass(className, to) {
    const elements = document.getElementsByTagName("td")
    for (let element of elements) {
        if (element.classList.contains(className)) {
            element.style.color = to;
        }
    }
}

function getTimeAsText() {
    const now = new Date();
    let hour = now.getHours();
    // convert 24h to 12h
    if(hour > 12)
        hour -= 12;
    let minute = now.getMinutes();
    // ceil minutes to next mod 5
    minute = Math.floor(minute / 5) * 5;
    let timeText = getLanguageSpecificTime(hour, minute).toLowerCase();
    for (const key in specialCases) {
        timeText = timeText.replace(key, specialCases[key]);
    }
    return timeText
}

function convertNumberToText(number) {
    if (number in numberToText) {
        return numberToText[number];
    } else {
        return number;
    }
}

function updateTime(override = false) {
    if (updating) {
        return;
    }
    updating = true;
    let time = getTimeAsText();

    const textElements = time.split(" ");

    const difference = compareArrays(lastTimeAsText, textElements);
    for (let element of difference) {
        //element is the name of the css class we want to edit
        changeCssClass(element, "var(--faint-text)");
    }

    const change = override ? textElements : compareArrays(textElements, lastTimeAsText);
    for (let element of change) {
        //element is the name of the css class we want to edit
        changeCssClass(element, "var(--visible-text)");
    }

    lastTimeAsText = textElements;
    updating = false;

    return difference.length > 0 || change.length > 0;
}

function update_AM_PM() {
    if (updating) {
        return;
    }
    updating = true;
    let m = isAM();
    changeCssClass("am", m ? "var(--visible-color)" : "var(--faint-text)");
    changeCssClass("pm", m ? "var(--faint-text)" : "var(--visible-color)");

    updating = false;
}

document.addEventListener('DOMContentLoaded', function() {
    setLanguageSelector();
    // get theme from local storage
    let theme = localStorage.getItem("theme");
    if(theme !== null) {
        setTheme(theme);
    } else {
        //get browser theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
        }
        // set browser-mode to local storage
        localStorage.setItem("theme", "browser");
        theme = "browser";
    }
    setThemeSelector(theme);
    show = localStorage.getItem("show");
    if(show !== null) {
        show = parseInt(show);
        if(show < 0 || show > maxShow) {
            show = 0;
            localStorage.setItem("show", show);
        }
    } else {
        show = 0;
        localStorage.setItem("show", show);
    }
    updateLoop();
});

window.onload = function() {
    // remove loading class from body
    document.body.classList.remove('loading');
}

function setLanguageSelector() {
    const languageSelector = document.getElementById("language");
    let selct = "";
    for(let l of languages){
        selct += `<option value="${l}" ${document.getElementById(l) != null ? "selected" : ""}>${l.charAt(0).toUpperCase() + l.slice(1)}</option>`;
    }
    languageSelector.innerHTML = selct;
}

function setThemeSelector(theme) {
    const themeSelector = document.getElementById("theme");
    selct = "";
    for(let i = 0; i < themes.length; i++){
        const t = themes[i];
        const tlang = themeLang[i];
        const themL = tlang.charAt(0).toUpperCase() + tlang.slice(1); 
        selct += `<option value="${t}" ${theme === t ? "selected" : ""}>${themL}</option>`;
    }
    themeSelector.innerHTML += selct;
}

function updateLoop() {
    resetCss();

    // stop old interval and timeout
    clearInterval(activeInterval);
    clearTimeout(activeTimeout);

    // start new interval
    if(show === 0) {
        updateTime(true);
        activeTimeout = setTimeout(interval5Min, milisecondsUntilNext5Minutes() + 1000);
    }
    else if(show === 1) {
        updateSeconds();
        activeTimeout = setTimeout(interval1Sec, milisecondsUntilNextSecond() + 10);
    }
    else if(show === 2) {
        update_AM_PM();
        activeTimeout = setTimeout(interval12Hours, milisecondsUntilNext12Hours() + 10);
    }
    changeing = false;
}

function interval5Min() {
    updateTime(true);
    activeInterval = setInterval(updateTime, 1000 * 60 * 5);
}

function interval1Sec() {
    updateSeconds();
    activeInterval = setInterval(updateSeconds, 1000);
}

function interval12Hours() {
    update_AM_PM();
    activeInterval = setInterval(update_AM_PM, 1000 * 60 * 60 * 12);
}

function milisecondsUntilNext5Minutes() {
    const now = new Date();
    const minute = now.getMinutes();
    const seconds = now.getSeconds();
    const miliseconds = now.getMilliseconds();
    const milisecondsUntilNext5Minutes = (5 - (minute % 5)) * 60 * 1000 - seconds * 1000 - miliseconds;
    return milisecondsUntilNext5Minutes;
}

function milisecondsUntilNextSecond() {
    const now = new Date();
    const miliseconds = now.getMilliseconds();
    const milisecondsUntilNextSecond = 1000 - miliseconds;
    return milisecondsUntilNextSecond;
}

function milisecondsUntilNext12Hours() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const miliseconds = now.getMilliseconds();
    const milisecondsUntilNext12Hours = (12 - (hours % 12)) * 60 * 60 * 1000 - minutes * 60 * 1000 - seconds * 1000 - miliseconds;
    return milisecondsUntilNext12Hours;
}

function milisecondsToTime(millis) {
    const hours = Math.floor(millis / 3600000).toFixed(0);
    const minutes = Math.floor((millis % 3600000) / 60000).toFixed(0);
    const seconds = Math.floor((millis % 60000) / 1000).toFixed(0);
    if (hours > 0)
        return hours + ":" + minutes + ":" + seconds;
    return minutes + ":" + seconds;
}

function changeMode(inc) {
    if(changeing)
        return;
    changeing = true;
    show += inc;
    if(show > maxShow) {
        show = 0;
    }
    else if(show < 0) {
        show = maxShow;
    }
    localStorage.setItem("show", show);
    updateLoop();
}

function changeModeAbsolute(value) {
    if(changeing)
        return;
    changeing = true;
    if (value < 0 || value > maxShow) {
        value = 0;
    }
    show = value;
    localStorage.setItem("show", show);
    updateLoop();
}

//for testing/debugging
let i = 60 * 12;
function createDate() {
    let minute = i % 60;
    let hour = Math.floor(i / 60);
    console.log(hour + ":" + minute);
    i += 5;
    return new Date(2022, 1, 1, hour, minute);
}



// experimental, show seconds


// each number is an array of 5x7
let number = new Array(10);

number[0] = [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
];

number[1] = [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0]
];

number[2] = [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1]
];

number[3] = [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
];

number[4] = [
    [0, 0, 0, 1, 0],
    [0, 0, 1, 1, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0]
];

number[5] = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
];

number[6] = [
    [0, 0, 1, 1, 0],
    [0, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
];

number[7] = [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0]
];

number[8] = [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
];

number[9] = [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0],
    [0, 1, 1, 0, 0]
];

function updateSeconds() {
    if (updating)
        return;
    updating = true;
    let table = document.getElementsByTagName("table")[0];
    // get possible tbody
    if(table.tBodies.length != 0) {
        table = table.tBodies[0];
    }
    let now = new Date();
    let seconds = now.getSeconds();
    let seconds1 = Math.floor(seconds / 10);
    let seconds2 = seconds % 10;
    let seconds1Array = number[seconds1];
    let seconds2Array = number[seconds2];
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 5; j++) {
            if (seconds1Array[i][j] == 1) {
                table.rows[i+2].cells[j].style.color = "var(--visible-text)";
            } else {
                table.rows[i+2].cells[j].style.color = "var(--faint-text)";
            }
            if (seconds2Array[i][j] == 1) {
                table.rows[i+2].cells[j + 6].style.color = "var(--visible-text)";
            } else {
                table.rows[i+2].cells[j + 6].style.color = "var(--faint-text)";
            }
        }
    }
    updating = false;
}

function resetCss() {
    let table = document.getElementsByTagName("table")[0];
    // get possible tbody
    if(table.tBodies.length != 0) {
        table = table.tBodies[0];
    }

    for(const element of table.rows) {
        for(const el of element.cells) {
            el.style.color = "var(--faint-text)";
        }
    }
}

function changeLang(lan) {
    //switch to language.html
    window.location.href = lan + ".html";
}

let autoThemeSwitchListener = window.matchMedia('(prefers-color-scheme: dark)');

function changeTheme(theme) {
    // save in local storage
    localStorage.setItem("theme", theme);
    setTheme(theme);
}

function setTheme(theme) {
    autoThemeSwitchListener.removeEventListener("change", setTheme);
    if (!["dark", "light"].includes(theme)) {
        //get browser theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            theme = "dark";
        } else {
            theme = "light";
        }
        autoThemeSwitchListener.addEventListener("change", setTheme);
    }
    if (theme == "dark") {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    } else if (theme == "light") {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
}

document.addEventListener("fullscreenchange", function() {
    const isFullscreen = document.fullscreenElement !== null;
    changeFullscreen(isFullscreen);
});

function changeFullscreen(isFullscreen) {
    const setToValue = isFullscreen ? "none" : "block";
    document.getElementById("modeDisplay").style.display = setToValue;
    document.getElementById("header").style.display = setToValue;
    document.getElementById("select").style.display = setToValue;
    document.getElementById("fullscreen-open").style.display = setToValue;
    if (!isFullscreen) {
        document.getElementById("fullscreen-exit").style.display = "none";
    }
}

function setFullscreen() {
    try {
        document.documentElement.requestFullscreen();
        // only show exit fullscreen button if user entered fullscreen via fullscreen button
        setTimeout(() => {
            document.getElementById("fullscreen-exit").style.display = "block";
        }, 200);
    } catch (error) {
        console.error(error);
    }
}

function exitFullscreen() {
    document.exitFullscreen();
}

// Throttle function
function throttle(fn, wait) {
    let time = Date.now();
    return function() {
        if ((time + wait - Date.now()) < 0) {
            fn();
            time = Date.now();
        }
    };
}

// Show exit fullscreen button on mousemove
let timeout;
document.addEventListener("mousemove", throttle(() => {
    clearTimeout(timeout);
    document.getElementById("fullscreen-exit").style.opacity = "1";
    timeout = setTimeout(() => {
        document.getElementById("fullscreen-exit").style.opacity = "0";
    }, 3000);
}, 100)); // Throttle to 100ms


document.addEventListener("keydown", event => {
    if(event.key === "ArrowRight") {
        changeMode(1);
    }
    else if(event.key === "ArrowLeft") {
        changeMode(-1);
    }
    else if(event.key === "F11") {
        // override default so that fullscreenchange event is triggered
        event.preventDefault();
        if(document.fullscreenElement === null) {
            try {
                document.documentElement.requestFullscreen();
            } catch (error) {
                console.error(error);
            }
        } else {
            document.exitFullscreen();
        }
    }
});
        

// lively Wallpaper API
function livelyPropertyListener(property, value) {
    // if this triggers we are in a lively wallpaper environment
    document.getElementById("select").style.display = "none";
    if(property === "aditionalUI") {
        changeFullscreen(!value);
        document.getElementById("select").style.display = "none";
    }

    if (property === "theme") {
        const themeLookup = {
            0: "auto",
            1: "light",
            2: "dark"
        };
        changeTheme(themeLookup[value]);
    }

    if (property === "show") {
        changeModeAbsolute(value);
    }
}
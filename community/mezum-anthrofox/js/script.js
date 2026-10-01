const PROP_SEASON = "season";
const PROP_TIME = "time";
const PROP_BEGINNING_OF_DAY = "beginningOfDay";
const PROP_END_OF_DAY = "endOfDay";
const PROP_UPDATE_INTERVAL_MINUTES = "updateIntervalMinutes";

const SEASON_AUTO_NORTHERN = "Auto - Northern";
const SEASON_AUTO_SOUTHERN = "Auto - Southern";
const SEASON_SPRING = "Spring";
const SEASON_SUMMER = "Summer";
const SEASON_AUTUMN = "Autumn";
const SEASON_WINTER = "Winter";
const PROP_SEASON_ITEMS = [
    SEASON_AUTO_NORTHERN,
    SEASON_AUTO_SOUTHERN,
    SEASON_SPRING,
    SEASON_SUMMER,
    SEASON_AUTUMN,
    SEASON_WINTER,
];

const TIME_SYSTEM = "System";
const TIME_DAY = "Day";
const TIME_NIGHT = "Night";
const PROP_TIME_ITEMS = [
    TIME_SYSTEM,
    TIME_DAY,
    TIME_NIGHT,
];

const CLASS_ACTIVE = "active";
const MONTH_TO_SEASON = [
    SEASON_WINTER, // January
    SEASON_WINTER, // February

    SEASON_SPRING, // March
    SEASON_SPRING, // April
    SEASON_SPRING, // May

    SEASON_SUMMER, // June
    SEASON_SUMMER, // July
    SEASON_SUMMER, // August

    SEASON_AUTUMN, // September
    SEASON_AUTUMN, // October
    SEASON_AUTUMN, // November

    SEASON_WINTER, // December
];

function livelyPropertyListener(key, value) {
    switch (key) {
        case PROP_SEASON:
            selectSeason = generateSeasonSelector(PROP_SEASON_ITEMS[value]);
            break;
        case PROP_TIME:
            selectTime = generateTimeSelector(PROP_TIME_ITEMS[value]);
            break;
        case PROP_BEGINNING_OF_DAY:
            beginningOfDay = parseTime(value);
            break;
        case PROP_END_OF_DAY:
            endOfDay = parseTime(value);
            break;
        case PROP_UPDATE_INTERVAL_MINUTES:
            updateIntervalMillis = value * 60 * 1000;
            break;
        default:
            console.warn(`Unknown property: ${key}`);
    }
    reset();
}

let timerId = null;
function reset() {
    if (timerId !== null) {
        clearInterval(timerId);
    }
    update();
    timerId = setInterval(update, updateIntervalMillis);
}

function update() {
    let season = selectSeason();
    let time = selectTime();
    activate(season, time);
}

let prevSeason = null;
let prevTime = null;
let activeElements = [];
function activate(season, time) {
    if (season === prevSeason && time === prevTime) {
        return;
    }
    activeElements.forEach(el => el.classList.remove(CLASS_ACTIVE));

    const elements = document.querySelectorAll(`*[data-season="${season}"][data-time="${time}"]`);
    elements.forEach(el => el.classList.add(CLASS_ACTIVE));
    activeElements = elements;
    prevSeason = season;
    prevTime = time;
}

function generateSeasonSelector(season) {
    let selector;
    switch (season) {
        case SEASON_AUTO_NORTHERN:
        case SEASON_AUTO_SOUTHERN:
            const offset = season === SEASON_AUTO_SOUTHERN ? 6 : 0;
            selector = () => {
                const month = new Date().getMonth();
                return MONTH_TO_SEASON[(month + offset) % MONTH_TO_SEASON.length];
            };
            break;
        case SEASON_SPRING:
        case SEASON_SUMMER:
        case SEASON_AUTUMN:
        case SEASON_WINTER:
            selector = () => season;
        default:
            console.warn(`Unknown season: ${season}`);
            selector = () => SEASON_SUMMER;
    };
    return selector;
}

function generateTimeSelector(time) {
    let selector;
    switch (time) {
        case TIME_SYSTEM:
            selector = () => {
                const now = new Date();
                const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
                return (hours >= beginningOfDay && hours < endOfDay) ? TIME_DAY : TIME_NIGHT;
            };
            break;
        case TIME_DAY:
        case TIME_NIGHT:
            selector = () => time;
            break;
        default:
            console.warn(`Unknown time: ${time}`);
            selector = () => TIME_DAY;
    }
    return selector;
}

function parseTime(value) {
    const pair = value.split(":", 3);
    let time = -1;
    try {
        time = (
            (parseInt(pair[0], 10) || 0)
            + parseInt((pair.length > 1 ? pair[1] : "0"), 10) / 60
            + parseInt((pair.length > 2 ? pair[2] : "0"), 10) / 3600
        );
    } catch (e) {
        console.warn(e);
    }

    if (!isFinite(time) || time < 0 || time >= 24) {
        time = 0;
    }

    return time;
}

let selectSeason = generateSeasonSelector(SEASON_AUTO_NORTHERN);
let selectTime = generateTimeSelector(TIME_SYSTEM);
let beginningOfDay = 6;
let endOfDay = 18;
let updateIntervalMillis = 60 * 1000;

reset();

const MINUTE_MS = 60000; // 1 minute in milliseconds
const BARS_UPDATE_MS = 250;
const SECOND_MS = 1000;

const PREFIX_IMG_BASE64 = "data:image/png;base64,";

const OWM_GET_URL = "https://api.openweathermap.org/data/2.5/weather?lat=" + _GEOLOC_INFO.LATITUDE + "&lon=" + _GEOLOC_INFO.LONGITUDE + "&appid=" + _GEOLOC_INFO.API_KEY + "&units=metric";

let playingSong = false;

// The following objects allow to interface the backend business logic with frontend

let lvAudioElements = {
    main: document.getElementById("music-main"),
    title: document.getElementById("music-title"),
    artist: document.getElementById("music-artist"),
    thumb: document.getElementById("music-viz"),
};

let lvSysStats = {
    cpu: 0,
    gpu: 0,
    ram: 0,
};

function livelySystemInformation(data) {
    const stats = JSON.parse(data);

    if (stats === null) {
        return;
    }

    lvSysStats.cpu = stats.CurrentCpu;
    lvSysStats.gpu = stats.CurrentGpu3D;
    lvSysStats.ram = stats.TotalRam - stats.CurrentRamAvail;
}

function livelyAudioListener(arr) {
    const sum = arr.reduce((acc, val) => acc + val, 0);

    if (sum > 0) {
        playingSong = true;
    } else {
        playingSong = false;
    }
}

function livelyCurrentTrack(data) {
    let info = JSON.parse(data);

    if (info === null) {
        lvAudioElements.main.style.display = "none";
        return;
    }

    lvAudioElements.main.style.display = "flex";

    lvAudioElements.title.textContent = info.Title || "Unknown Track";
    lvAudioElements.artist.textContent = info.Artist || "Unknown Artist";

    if (info.Thumbnail !== null) {
        lvAudioElements.thumb.src = PREFIX_IMG_BASE64 + info.Thumbnail;
    }
}

function musicBars() {
    const barsContainer = document.getElementById("music-bars");
    const bars = document.querySelectorAll(".bar");
    const barsArray = Array.from(bars);

    setInterval(() => {
        if (playingSong) {
            barsArray.forEach(bar => {
                // Generate random height between 20% and 100%
                const newHeight = Math.random() * 80 + 20;
                bar.style.height = `${newHeight}%`;
            });
        } else {
            barsArray.forEach(bar => {
                bar.style.height = "5%";
            });
        }

    }, BARS_UPDATE_MS);
}

function timer() {
    const clock = document.getElementById("clock");
    const date = document.getElementById("date-internal");
    const day = document.getElementById("day");

    function updateClock() {
        const now = new Date();

        // Format time as HH:MM:SS
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clock.textContent = `${hours}:${minutes}`;

        // Format date as 25th October 2024
        const dayOfMonth = now.getDate();
        const month = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();
        const suffix = dayOfMonth % 10 === 1 && dayOfMonth !== 11 ? 'st' :
                       dayOfMonth % 10 === 2 && dayOfMonth !== 12 ? 'nd' :
                       dayOfMonth % 10 === 3 && dayOfMonth !== 13 ? 'rd' : 'th';
        date.textContent = `${dayOfMonth}${suffix} ${month} ${year}`;

        // Format day as "Monday", "Tuesday", etc.
        const weekday = now.toLocaleString('default', { weekday: 'long' });
        day.textContent = weekday;
    }

    // Update clock immediately and then every second
    updateClock();
    setInterval(updateClock, SECOND_MS);
}

function greeting() {
    const element = document.getElementById("greeting-internal");
    const nameElement = document.getElementById("greeting-name");

    let name;
    if (_GEOLOC_INFO && _GEOLOC_INFO.NAME) {
        name = _GEOLOC_INFO.NAME;
    } else {
        name = "!";
    }
    nameElement.textContent = name;

    const greetings = {
        morning: "Good morning",
        afternoon: "Good afternoon",
        evening: "Good evening",
    };

    function updateGreeting() {
        const now = new Date();
        const hours = now.getHours();

        if (hours < 12) {
            element.textContent = greetings.morning;
        } else if (hours < 16) {
            element.textContent = greetings.afternoon;
        } else {
            element.textContent = greetings.evening;
        }
    }

    setInterval(updateGreeting, MINUTE_MS); // Update every minute

    updateGreeting(); // Initial call to set greeting immediately
}

function stats() {
    const cpu = document.getElementById("stat-cpu");
    const gpu = document.getElementById("stat-gpu");
    const ram = document.getElementById("stat-ram");

    setInterval(() => {
        cpu.textContent = `${lvSysStats.cpu}%`;
        gpu.textContent = `${lvSysStats.gpu}%`;
        ram.textContent = `${lvSysStats.ram}%`;
    }, SECOND_MS);
}

function weather() {
    const suffixes = {
        humidity: "%",
        wind: " m/s",
        pressure: " hPa",
    };

    const main_element = document.getElementById("weather-main");

    const icon_element = document.getElementById("weather-icon");
    const temp_element = document.getElementById("weather-temp-internal");

    const humidity_element = document.getElementById("weather-hum");
    const wind_element = document.getElementById("weather-wind");
    const pressure_element = document.getElementById("weather-press");

    function updateWeather() {
        fetch(OWM_GET_URL).then((res) => {
            if (!res.ok) {
                console.error("Failed to fetch weather data:", res.statusText);
                return;
            }
            
            res.json().then((data) => {
                if (!data || !data.weather || !data.main || !data.wind) {
                    console.error("Invalid weather data:", data);
                    return;
                }

                const icon = _WEATHER_ICON_MAP.get(data.weather[0].icon);
                const temp = Math.round(data.main.temp);
                
                const humidity = data.main.humidity;
                const wind = data.wind.speed;
                const pressure = data.main.pressure;

                const iconSrc = icon ? icon : "/weather/icon_sun_day.svg"; // Default icon
                icon_element.src = iconSrc;
                temp_element.textContent = temp;

                humidity_element.textContent = `${humidity}${suffixes.humidity}`;
                wind_element.textContent = `${wind}${suffixes.wind}`;
                pressure_element.textContent = `${pressure}${suffixes.pressure}`;

                main_element.style.display = "flex";

                console.log("Successful weather retrieval at " + new Date().toLocaleTimeString() + ": " + data.weather[0].description);
            });
        });
    }

    setInterval(updateWeather, MINUTE_MS); // Update every minute

    updateWeather(); // Initial call to set weather immediately
}

function main() {
    timer(); // Start the timer function
    musicBars();
    greeting();
    stats();
    weather();

    console.log("Hello world!"); // Debugging message
}

main();
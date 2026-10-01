let use24HourFormat = false;

function livelyPropertyListener(name, val) {
    switch (name) {
        case 'backgroundColor':
            document.body.style.backgroundColor = val;
            break;
        case 'mainFontSize':
            document.getElementById('mainText').style.fontSize = val + 'px';
            break;
        case 'subFontSize':
            document.getElementById('subText').style.fontSize = val + 'px';
            break;
        case 'infoFontSize':
            document.getElementById('datetime').style.fontSize = val + 'px';
            break;
        case 'mainFontColor':
            document.getElementById('mainText').style.color = val;
            break;
        case 'subFontColor':
            document.getElementById('subText').style.color = val;
            break;
        case 'infoFontColor':
            document.getElementById('datetime').style.color = val;
            break;
        case 'use24HourFormat':
            use24HourFormat = val;
            updateDateTime();
            break;
        default:
            break;
    }
}

function updateDateTime() {
    const now = new Date();
    const time = use24HourFormat ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const month = now.toLocaleDateString('en-US', { month: 'long' });
    const year = now.getFullYear();
    
    document.getElementById('datetime').textContent = 
        `${time} | ${day} | ${month} | ${year}`;
}

updateDateTime();
setInterval(updateDateTime, 1000);
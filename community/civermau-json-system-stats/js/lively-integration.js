// Lively Wallpaper Integration Functions

function livelyCurrentTrack(data) {
    var obj = JSON.parse(data);
    if (obj != null) {
        //A funny thing happened, I used lowercase for the object attributes, and of course it didn't work.
        //Yeah I forgot that this things are case-sensitive.
        currentTrack = obj.Title ?? "Could not get track";
        currentArtist = obj.Artist ?? "Could not get artist";
        currentAlbum = obj.Album ?? "Could not get album";
    }
    else {
        currentTrack = "No track playing unu";
        currentArtist = null;
        currentAlbum = null;
    }
}

// Main Lively system information callback
async function livelySystemInformation(data) {
  var obj = JSON.parse(data);

  cpuName = obj.NameCpu;
  gpuName = obj.NameGpu;
  memTotal = obj.TotalRam;
  memUsed = obj.TotalRam - obj.CurrentRamAvail;

  navigator.getBattery().then(function (battery) {
    batteryLevel = Math.round(battery.level * 100) + "%";
    batteryStatus = battery.charging ? "Plugged in" : "Not plugged in";
    batteryTimeRemaining = battery.charging
      ? battery.chargingTime
      : battery.dischargingTime;
  });
}

// Lively property listener for handling configuration changes
function livelyPropertyListener(name, val) {
  switch (name) {
    case "computerDisplay":
      computerDisplay = val;
      break;
    case "batteryDisplay":
      batteryDisplay = val;
      break;
    case "systemAudioDisplay":
      systemAudioDisplay = val;
      break;
    case "fontSize":
      document.getElementById("json-display").style.fontSize = val + "px";
      break;
    case "ramDisplay":
      ramDisplayGB = val;
      break;
    case "dateFormat":
      dateFormatddmmyyyy = val;
      break;
    case "timeFormat":
      timeFormat24h = val;
      break;
    case "customColors":
      customColors = val;
      applyCustomColors();
      break;
    case "backgroundColor":
      backgroundColor = val;
      if (customColors) applyCustomColors();
      break;
    case "keyColor":
      keyColor = val;
      if (customColors) applyCustomColors();
      break;
    case "stringColor":
      stringColor = val;
      if (customColors) applyCustomColors();
      break;
    case "integerColor":
      integerColor = val;
      if (customColors) applyCustomColors();
      break;
    case "nullColor":
      nullColor = val;
      if (customColors) applyCustomColors();
      break;
    case "bracketsColor":
      bracketsColor = val;
      if (customColors) applyCustomColors();
      break;
    case "accentColor":
      accentColor = val;
      if (customColors) applyCustomColors();
      break;
  }
  refreshJsonDisplay();
} 
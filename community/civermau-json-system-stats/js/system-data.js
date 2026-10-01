// System Data Management Functions

// Update system time every second
setInterval(() => {
  refreshJsonDisplay();
}, 1000);


// Function to refresh the JSON display when properties change
async function refreshJsonDisplay() {
  try {
    dateTime = new Date();

    const jsonDisplay = document.getElementById("json-display");
    if (jsonDisplay) {
      let jsonText = jsonDisplay.textContent;
      let jsonObj = JSON.parse(jsonText);

      if (jsonObj) {
        jsonObj.date = dateFormatddmmyyyy ? dateTime.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }) : dateTime.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        jsonObj.time = !timeFormat24h ? dateTime.toLocaleTimeString('en-US') : dateTime.toLocaleTimeString('en-GB');
        jsonObj.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        jsonObj.day = dateTime.toLocaleDateString('en-US', { weekday: 'long' });
        jsonObj.month = dateTime.toLocaleDateString('en-US', { month: 'long' });
        jsonObj.year = dateTime.getFullYear();

        if (computerDisplay) {
          // Create or update computer object
          if (!jsonObj.Computer) {
            jsonObj.Computer = {};
          }
          
          jsonObj.Computer.CPU = cpuName;
          jsonObj.Computer.GPU = gpuName;
          if (ramDisplayGB) {
            jsonObj.Computer["RAM Usage"] =
              (memUsed / 1024).toFixed(2) +
              "/" +
              (memTotal / 1024).toFixed(2) +
              " GB";
          } else {
            jsonObj.Computer["RAM Usage"] = memUsed + "/" + memTotal + " MB";
          }

          // Only show battery if both computerDisplay and batteryDisplay are enabled
          const deviceHasBattery = await hasBattery();
          if (deviceHasBattery && batteryDisplay) {
            jsonObj.Computer.Battery = {
              level: batteryLevel,
              status: batteryStatus,
              timeRemaining: formatBatteryTime(batteryTimeRemaining),
            };
          } else {
            // Remove battery info if batteryDisplay is disabled or no battery
            delete jsonObj.Computer.Battery;
          }
        } else {
          // Remove entire computer object if computerDisplay is disabled
          delete jsonObj.Computer;
        }

        if (systemAudioDisplay) {
          if (!jsonObj.CurrentlyPlaying) {
            jsonObj.CurrentlyPlaying = {};
          }
          jsonObj.CurrentlyPlaying.Track = currentTrack;
          jsonObj.CurrentlyPlaying.Artist = currentArtist;
          jsonObj.CurrentlyPlaying.Album = currentAlbum;
        } else {
          delete jsonObj.CurrentlyPlaying;
        }

        // Update the JSON display
        updateJsonDisplay(jsonObj);
      }
    }
  } catch (e) {
    console.error("Error refreshing JSON display:", e);
  }
}
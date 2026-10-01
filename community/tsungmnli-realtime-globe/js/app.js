let updateTimer = null; // Store the scheduled update timer
let selectedType = "trm"; // Default selected type

async function fetchLatestImageTime() {
  const url =
    "https://www.data.jma.go.jp/mscweb/data/himawari/sat_img.php?area=fd_";

  try {
    const response = await fetch(url);
    const text = await response.text();

    // Parse the HTML response
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    // Select the <select> element using its name
    const selectElement = doc.querySelector('select[name="slt_time"]');

    if (selectElement) {
      const firstOption = selectElement.options[0];
      return firstOption ? firstOption.value : null;
    } else {
      console.error("Select element not found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching image time:", error);
    return null;
  }
}

async function setGlobeImage() {
  const timeValue = await fetchLatestImageTime();
  if (!timeValue) return;

  const imageUrl = `https://www.data.jma.go.jp/mscweb/data/himawari/img/fd_/fd__${selectedType}_${timeValue}.jpg`;

  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error("Image not found");

    const targetDiv = document.getElementById("globeContainer");
    if (targetDiv) {
      targetDiv.style.backgroundImage = `url(${imageUrl})`;
      targetDiv.style.backgroundSize = "cover";
      targetDiv.style.backgroundPosition = "center";
    } else {
      console.error("Div with ID 'globeContainer' not found.");
    }
  } catch (error) {
    console.error("Error setting globe image:", error);
  }
}

function scheduleNextUpdate() {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Calculate the time until the next update (next 10-minute mark)
  const nextUpdateMinutes = Math.ceil(minutes / 10) * 10 + 1;
  const minutesUntilNextUpdate = nextUpdateMinutes - minutes;

  // If it's exactly on the 10-minute mark, update immediately
  if (minutes % 10 === 0 && seconds === 0) {
    setGlobeImage();
  }

  // Calculate the time (in milliseconds) until the next update
  const timeUntilNextUpdate =
    minutesUntilNextUpdate * 60 * 1000 - seconds * 1000;

  console.log(
    `Next update scheduled in ${Math.round(
      timeUntilNextUpdate / 1000 / 60
    )} minutes.`
  );

  // Clear any existing scheduled update
  if (updateTimer) clearTimeout(updateTimer);

  // Schedule the next update
  updateTimer = setTimeout(() => {
    setGlobeImage();
    scheduleNextUpdate(); // Reschedule the next update
  }, timeUntilNextUpdate);
}

// Function to manually refresh image
function refreshGlobeImage() {
  console.log("Manual update triggered.");
  if (updateTimer) clearTimeout(updateTimer); // Stop the auto scheduler
  setGlobeImage().then(scheduleNextUpdate); // Update immediately and restart scheduler
}

// Handle selection change from imageSelect
document.querySelectorAll("#imageSelect .image-option").forEach((item) => {
  item.addEventListener("click", function () {
    // Remove 'selected' from all items
    document
      .querySelectorAll("#imageSelect .image-option")
      .forEach((li) => li.removeAttribute("selected"));

    // Add 'selected' to clicked item
    this.setAttribute("selected", "true");

    // Update selected type
    selectedType = this.getAttribute("value");
    console.log(`Selected Type: ${selectedType}`);

    refreshGlobeImage(); // Fetch and update immediately
  });
});

// Initialize: Load first image and start the scheduler
setGlobeImage().then(scheduleNextUpdate);

const globeContainer = document.getElementById("globeContainer");
const resizeMsg = document.getElementById("resizeMsg");
const refreshMsg = document.getElementById("refreshMsg");

globeContainer.addEventListener("click", refreshGlobeImage);

let containerSize = 60;
const minSize = 20;
const maxSize = 100;

// Store timeout IDs to prevent overlapping fade-outs
let resizeTimeout, refreshTimeout;

// Function to update and fade out messages properly
function updateMessage(element, message, timeoutVar) {
  element.textContent = message;
  element.style.opacity = "1"; // Show message

  // Clear any existing timeout to prevent overlap
  clearTimeout(timeoutVar);

  // Set new timeout for fade-out
  timeoutVar = setTimeout(() => {
    element.style.opacity = "0";

    // Clear text after fade-out completes
    setTimeout(() => {
      element.textContent = "";
    }, 500);
  }, 800);

  // Save timeout reference for future clear
  if (element === resizeMsg) {
    resizeTimeout = timeoutVar;
  } else {
    refreshTimeout = timeoutVar;
  }
}

// Function to handle resizing
function resizeGlobe(change) {
  containerSize = Math.min(Math.max(containerSize + change, minSize), maxSize);

  globeContainer.style.width = `${containerSize}vmin`;
  globeContainer.style.height = `${containerSize}vmin`;

  // Convert to percentage based on 60vmin as 100%
  const msg = Math.round((containerSize / 60) * 100);
  updateMessage(resizeMsg, `Size: ${msg}%`, resizeTimeout);
}

// Handle mouse wheel scrolling
globeContainer.addEventListener("wheel", (event) => {
  if (
    document.activeElement === document.body ||
    document.activeElement === document.documentElement
  ) {
    event.preventDefault();
    resizeGlobe(event.deltaY < 0 ? 10 : -10);
  }
});

// Handle keyboard arrow keys
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    resizeGlobe(10);
  } else if (event.key === "ArrowDown") {
    resizeGlobe(-10);
  }
});

// Handle button clicks
growGlobeBtn.addEventListener("click", () => resizeGlobe(10));
shrinkGlobeBtn.addEventListener("click", () => resizeGlobe(-10));

// Override refresh function to notify success
async function refreshGlobeImage() {
  await setGlobeImage();
  updateMessage(refreshMsg, "Refresh successful!", refreshTimeout);
}

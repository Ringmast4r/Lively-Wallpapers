// Utility Functions

// If font is too big that content doesn't fit in the screen, it will be scrollable with mouse position, 
// hovering down will make it scroll down.
// hovering up will make it scroll up.

// Scroll button functionality
let scrollUpButton, scrollDownButton;
let isScrolling = false;

// Initialize scroll buttons
function initializeScrollButtons() {
  // Create scroll up button
  scrollUpButton = document.createElement('div');
  scrollUpButton.className = 'scroll-button scroll-up accent-color';
  scrollUpButton.innerHTML = '↑';
  scrollUpButton.addEventListener('click', () => scrollContent('up'));
  
  // Create scroll down button
  scrollDownButton = document.createElement('div');
  scrollDownButton.className = 'scroll-button scroll-down accent-color';
  scrollDownButton.innerHTML = '↓';
  scrollDownButton.addEventListener('click', () => scrollContent('down'));
  
  // Add buttons to body
  document.body.appendChild(scrollUpButton);
  document.body.appendChild(scrollDownButton);
  
  // Check overflow on load and resize
  checkContentOverflow();
  window.addEventListener('resize', checkContentOverflow);
  
  // Listen for content changes
  const jsonDisplay = document.getElementById('json-display');
  if (jsonDisplay) {
    const observer = new MutationObserver(checkContentOverflow);
    observer.observe(jsonDisplay, { childList: true, subtree: true, characterData: true });
    
    // Listen for scroll events to update button visibility
    jsonDisplay.addEventListener('scroll', updateButtonVisibility);
  }
}

// Check if content overflows and show/hide buttons accordingly
function checkContentOverflow() {
  const jsonDisplay = document.getElementById('json-display');
  if (!jsonDisplay) return;
  
  const hasOverflow = jsonDisplay.scrollHeight > jsonDisplay.clientHeight;
  
  if (hasOverflow) {
    scrollUpButton.style.display = 'flex';
    scrollDownButton.style.display = 'flex';
    updateButtonVisibility();
  } else {
    scrollUpButton.style.display = 'none';
    scrollDownButton.style.display = 'none';
  }
}

// Update button visibility based on scroll position
function updateButtonVisibility() {
  const jsonDisplay = document.getElementById('json-display');
  if (!jsonDisplay) return;
  
  const isAtTop = jsonDisplay.scrollTop <= 0;
  const isAtBottom = jsonDisplay.scrollTop >= jsonDisplay.scrollHeight - jsonDisplay.clientHeight - 1;
  
  scrollUpButton.style.opacity = isAtTop ? '0' : '1';
  scrollUpButton.style.pointerEvents = isAtTop ? 'none' : 'auto';
  
  scrollDownButton.style.opacity = isAtBottom ? '0' : '1';
  scrollDownButton.style.pointerEvents = isAtBottom ? 'none' : 'auto';
}

// Smooth scroll content
function scrollContent(direction) {
  const jsonDisplay = document.getElementById('json-display');
  if (!jsonDisplay || isScrolling) return;
  
  isScrolling = true;
  const scrollAmount = jsonDisplay.clientHeight * 0.8; // Scroll 80% of visible height
  const currentScroll = jsonDisplay.scrollTop;
  const targetScroll = direction === 'up' 
    ? Math.max(0, currentScroll - scrollAmount)
    : Math.min(jsonDisplay.scrollHeight - jsonDisplay.clientHeight, currentScroll + scrollAmount);
  
  // Smooth scroll animation
  const startTime = performance.now();
  const duration = 500; // 500ms animation
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeInOutCubic = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    const newScrollTop = currentScroll + (targetScroll - currentScroll) * easeInOutCubic;
    jsonDisplay.scrollTop = newScrollTop;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isScrolling = false;
      updateButtonVisibility();
    }
  }
  
  requestAnimationFrame(animate);
}

// Initialize scroll buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeScrollButtons);

// Check if the device has a battery
async function hasBattery() {
  if (!("getBattery" in navigator)) return false;
  try {
    const bat = await navigator.getBattery();
    // portable devices will have a battery level < 1 or charging toggling
    return bat.level < 1 || "chargingTime" in bat;
  } catch {
    return false;
  }
}

// Function to format battery time in a user-friendly way
function formatBatteryTime(seconds) {
  if (seconds === null || seconds === undefined || !isFinite(seconds) || seconds <= 0) {
    return "Not available";
  }
  
  // Convert to minutes for easier reading
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${Math.round(remainingMinutes)}m`;
  } else {
    return `${Math.round(minutes)}m`;
  }
} 
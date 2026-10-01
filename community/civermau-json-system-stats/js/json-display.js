// JSON Display and Formatting Functions

// Initialize JSON display with syntax highlighting
document.addEventListener("DOMContentLoaded", function () {
  const jsonDisplay = document.getElementById("json-display");
  let jsonText = jsonDisplay.textContent;
  try {
    jsonText = JSON.parse(jsonText);
    updateJsonDisplay(jsonText);
    
    // Apply custom colors if enabled
    if (customColors) {
      applyCustomColors();
    }
  } catch (e) {
    console.error("Error parsing JSON:", e);
  }
});

// Function to update the JSON display with new values and syntax highlighting
function updateJsonDisplay(jsonObj) {
  const jsonDisplay = document.getElementById("json-display");
  if (!jsonDisplay) return;

  // Re-stringify with formatting
  let jsonText = JSON.stringify(jsonObj, null, 4);

  // Apply syntax highlighting
  jsonText = jsonText
    // Highlight keys
    .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:')
    // Highlight string values
    .replace(/: "([^"]+)"/g, ': <span class="string">"$1"</span>')
    // Highlight number values
    .replace(/: (\d+(\.\d+)?)/g, ': <span class="number">$1</span>')
    // Highlight boolean values
    .replace(/: (true|false)/g, ': <span class="boolean">$1</span>')
    // Highlight null values
    .replace(/: (null)/g, ': <span class="null">$1</span>')
    // Highlight all brackets
    .replace(/\{/g, '<span class="brackets">{</span>')
    .replace(/\}/g, '<span class="brackets">}</span>');

  // Set the highlighted HTML
  jsonDisplay.innerHTML = jsonText;
}

// Function to apply custom colors from livelyProperties
function applyCustomColors() {
  if (customColors) {
    // Create a style element if it doesn't exist
    let customStyle = document.getElementById('custom-colors-style');
    if (!customStyle) {
      customStyle = document.createElement('style');
      customStyle.id = 'custom-colors-style';
      document.head.appendChild(customStyle);
    }
    
    // Update the CSS with custom colors
    customStyle.textContent = `
      #json-display .key { color: ${keyColor} !important; }
      #json-display .string { color: ${stringColor} !important; }
      #json-display .number { color: ${integerColor} !important; }
      #json-display .null { color: ${nullColor} !important; }
      #json-display .brackets { color: ${bracketsColor} !important; }
      body { background-color: ${backgroundColor} !important; }`;
  } else {
    // Remove custom styles if custom colors are disabled
    const customStyle = document.getElementById('custom-colors-style');
    if (customStyle) {
      customStyle.textContent = '';
    }
  }
} 
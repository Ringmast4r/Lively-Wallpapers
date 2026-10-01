// Global Configuration Variables
// System information variables
var memTotal = 1;
var memUsed = 0;
var cpuName = "";
var gpuName = "";
var dateTime = new Date();

var currentTrack = "";
var currentArtist = "";
var currentAlbum = "";

// Display toggle variables
var computerDisplay = false;
var batteryDisplay = false;
var systemAudioDisplay = false;

// UI configuration variables
var fontSize = 10;
var ramDisplayGB = false;
var dateFormatddmmyyyy = true;
var timeFormat24h = true;

// Color customization variables
var customColors = false;
var backgroundColor = "#282A37";
var keyColor = "#9cdcfe";
var stringColor = "#E5EC99";
var integerColor = "#666a44";
var bracketsColor = "#ffffff";

// Date/time constants
var months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Battery-specific variables (for laptop only)
var batteryLevel = 0;
var batteryStatus = "";
var batteryTimeRemaining = 0; 
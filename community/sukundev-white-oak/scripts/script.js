function getDate() {
  var currentDate = new Date();
  var informasiWaktu = {
    days: currentDate.toLocaleDateString("id-ID", { weekday: "long" }),
    day: currentDate.getDate(),
    month: currentDate.toLocaleDateString("id-ID", { month: "long" }),
    year: currentDate.getFullYear(),
    time: currentDate.toLocaleTimeString("id-ID", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }),
  };

  document.getElementById("days").innerHTML = informasiWaktu.days;
  document.getElementById("clocks").innerHTML = informasiWaktu.time;
  document.getElementById(
    "dates"
  ).innerHTML = `${informasiWaktu.day}, ${informasiWaktu.month} ${informasiWaktu.year}`;
}

document.addEventListener("DOMContentLoaded", function () {
  var video = document.getElementById("animated-background");
  video.playbackRate = 1.0;

  setInterval(function () {
    getDate();
  }, 1000);
});

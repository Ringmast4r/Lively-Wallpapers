import {ClockChar} from './clock.js';


// Get the canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

//smallerDimension is the size of the smaller side of the window
var clocks_width = 20;
var ClockSize;
setClockSize();

var ShowSeconds = true;
var ClockSizePercent = 0.75;
var HandleColor = "#00FF00";

function livelyPropertyListener(name, val)
{    
    switch(name) {
        case "CheckboxShowSeconds":
            ShowSeconds = val === "true" || val === true;
            break;
        case "SliderClockSize":
            ClockSizePercent = parseInt(val) / 100;
            break;
        case "ColorClockHandle":
            HandleColor = val;
            ClockChar1.update_handle_color(HandleColor);
            ClockChar2.update_handle_color(HandleColor);
            ClockChar3.update_handle_color(HandleColor);
            ClockChar4.update_handle_color(HandleColor);
            ClockChar5.update_handle_color(HandleColor);
            ClockChar6.update_handle_color(HandleColor);
            break;
    }
}

let ClockChar1 = new ClockChar(canvas.width/2 - ClockSize * ClockSizePercent * 8, canvas.height/2, ClockSize * ClockSizePercent, HandleColor);
let ClockChar2 = new ClockChar(canvas.width/2 - ClockSize * ClockSizePercent * 5, canvas.height/2, ClockSize * ClockSizePercent, HandleColor);
let ClockChar3 = new ClockChar(canvas.width/2 - ClockSize * ClockSizePercent * 1.5, canvas.height/2, ClockSize * ClockSizePercent, HandleColor);
let ClockChar4 = new ClockChar(canvas.width/2 + ClockSize * ClockSizePercent * 1.5, canvas.height/2, ClockSize * ClockSizePercent, HandleColor);
let ClockChar5 = new ClockChar(canvas.width/2 + ClockSize * ClockSizePercent * 5, canvas.height/2, ClockSize * ClockSizePercent, HandleColor);
let ClockChar6 = new ClockChar(canvas.width/2 + ClockSize * ClockSizePercent * 8, canvas.height/2, ClockSize * ClockSizePercent, HandleColor);


ClockChar1.set("1");
ClockChar1.draw(ctx);

ClockChar2.set("2");
ClockChar2.draw(ctx);

ClockChar3.set("3");
ClockChar3.draw(ctx);

ClockChar4.set("4");
ClockChar4.draw(ctx);

ClockChar5.set("5");
ClockChar5.draw(ctx);

ClockChar6.set("6");
ClockChar6.draw(ctx);




window.addEventListener('resize', () => {
    setClockSize();
      
    ClockChar1.update_clock_pos(canvas.width/2 - ClockSize * ClockSizePercent * 8, canvas.height/2,);
    ClockChar1.update_clock_size(ClockSize * ClockSizePercent);

    ClockChar2.update_clock_pos(canvas.width/2 - ClockSize * ClockSizePercent * 5, canvas.height/2,);
    ClockChar2.update_clock_size(ClockSize * ClockSizePercent);

    ClockChar3.update_clock_pos(canvas.width/2 - ClockSize * ClockSizePercent * 1.5, canvas.height/2,);
    ClockChar3.update_clock_size(ClockSize * ClockSizePercent);

    ClockChar4.update_clock_pos(canvas.width/2 + ClockSize * ClockSizePercent * 1.5, canvas.height/2,);
    ClockChar4.update_clock_size(ClockSize * ClockSizePercent);

    ClockChar5.update_clock_pos(canvas.width/2 + ClockSize * ClockSizePercent * 5, canvas.height/2,);
    ClockChar5.update_clock_size(ClockSize * ClockSizePercent);

    ClockChar6.update_clock_pos(canvas.width/2 + ClockSize * ClockSizePercent * 8, canvas.height/2,);
    ClockChar6.update_clock_size(ClockSize * ClockSizePercent);

    ClockChar1.draw(ctx);
    ClockChar2.draw(ctx);
    ClockChar3.draw(ctx);
    ClockChar4.draw(ctx);
    ClockChar5.draw(ctx);
    ClockChar6.draw(ctx);
});


function setClockSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    ClockSize = Math.min(canvas.width/clocks_width, canvas.height/5);
}
const timeElm = document.getElementById('time');
const doc = document.documentElement;
const { clientWidth, clientHeight } = doc;

const pad = val => val < 10 ? `0${val}` : val;

const animationFrame$ = Rx.Observable.interval(0, Rx.Scheduler.animationFrame);

const time$ = Rx.Observable.
interval(1000).
map(() => {
  const time = new Date();

  return {
    hours: time.getHours(),
    minutes: time.getMinutes(),
    seconds: time.getSeconds() };

}).
subscribe(({ hours, minutes, seconds }) => {
  timeElm.setAttribute('data-hours', pad(hours));
  timeElm.setAttribute('data-minutes', pad(minutes));
  timeElm.setAttribute('data-seconds', pad(seconds));
});

const mouse$ = Rx.Observable.
fromEvent(document, 'mousemove').
map(({ clientX, clientY }) => ({
  x: (clientWidth / 2 - clientX) / clientWidth,
  y: (clientHeight / 2 - clientY) / clientHeight }));


const smoothMouse$ = animationFrame$.
withLatestFrom(mouse$, (_, m) => m).
scan(RxCSS.lerp(0.1));

RxCSS({
  mouse: smoothMouse$ },
timeElm);

var bgColor = "#121212";
var bgImage = 'none';
var imgChecked = false;
function livelyPropertyListener(name, val)
{
  switch(name) {
      case "clockColor1":
	  document.querySelector(":root").style.setProperty("--inner-color",val);///#0000
      break;
      case "clockColor2":
	  document.querySelector(":root").style.setProperty("--glow",val);//#008000
      break;      
    case "bgColor":
      bgColor = val;
      if(!imgChecked)
      {
        document.getElementsByTagName('body')[0].style.background = val;
      }
      break;
    case "imgSelect":
      bgImage = val;
      if(imgChecked)
      {
        document.getElementsByTagName('body')[0].style.background = "url('../" + val.replace('\\', '/')+ "') no-repeat top left";
        document.getElementsByTagName('body')[0].style.backgroundSize = "100% 100%";
      }
      break;
    case "imageChk":
      imgChecked = val;
      if(val)
      {
        document.getElementsByTagName('body')[0].style.background = "url('../" + bgImage.replace('\\', '/')+ "') no-repeat top left";
        document.getElementsByTagName('body')[0].style.backgroundSize = "100% 100%";
      }
      else
      {
        document.getElementsByTagName('body')[0].style.background = bgColor;
      }
      break; 
  }
}

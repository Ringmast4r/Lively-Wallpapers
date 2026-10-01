const foregroundContainer = $("#foregroundContainer");
const albumContainer = $("#albumContainer");
const albumArt = $("#albumArt");
const track = $("#track");
const artist = $("#artist");
const albumBackgroundImage = $("#albumBackgroundImage");
const backgroundImage = $("#backgroundImage");

const blankImage = "res/blank.jpg";

// Setup values
albumArt[0].src = blankImage;
albumBackgroundImage[0].src = blankImage;

// Stored values
shouldDimBg = true;
shouldBlurBg = true;


// Get current album info
function livelyCurrentTrack(data) {
  let obj = JSON.parse(data);
  if (obj != null && obj.Thumbnail != null) {
    albumArt[0].src = "data:image/png;base64, " + obj.Thumbnail;
    albumBackgroundImage[0].src = "data:image/png;base64, " + obj.Thumbnail;
    track[0].innerText = obj.Title;
    artist[0].innerText = obj.Artist;
    handleIsPlaying(true);
  } else {
    handleIsPlaying(false);
  }
}

// Control visibility
function handleIsPlaying(isPlaying) {
  if( isPlaying ){
    foregroundContainer.css("opacity", 1);

    if( shouldDimBg ){
      backgroundImage.removeClass('disableDimEffect');
    }
      
    if( shouldBlurBg ){
      backgroundImage.removeClass('disableBlurEffect');
    }

  } else {
    foregroundContainer.css("opacity", 0);
    backgroundImage.addClass('disableDimEffect');
    backgroundImage.addClass('disableBlurEffect');
  }
}

// Handle properties
function livelyPropertyListener(name, val) {
  switch(name) {
    case 'showAlbumArt':
      albumArt.css('display', val ? 'block' : 'none');
      break;

    case 'albumSize':
      albumArt.css('height', `${val}vh`);
      break;

    case 'albumCornerRadius':
      albumArt.css('border-radius', `${val}px`);
      break;
    
    case 'showTrackName':
      track.css('display', val ? 'block' : 'none');
      break;

    case 'showArtistName':
      artist.css('display', val ? 'block' : 'none');
      break;
    
    case 'trackInfoAlignment':
      const alignmentOptions = ['center', 'flex-start', 'flex-end'];
      albumContainer.css('align-items', alignmentOptions[val]);
      break;
  
    case 'trackInfoFont':
      albumContainer.css('font-family', `${val}, sans-serif`);   
      break;

    case "trackInfoSize":
      albumContainer.css('font-size', `${val}rem`);
      break;

    case "trackInfoBrightness":
      track.css('opacity', val);
      artist.css('opacity', val);
      break;
    
    case "bgImage":
      backgroundImage[0].src = val;
      break;
    
    case "dimBackgroundWhilePlaying":
      if( val ){
        backgroundImage.addClass('dimBg');
      } else {
        backgroundImage.removeClass('dimBg');
      }
      break;

    case "blurBackgroundWhilePlaying":
      if( val ){
        backgroundImage.addClass('blurBg');
      } else {
        backgroundImage.removeClass('blurBg');
      }
      break;
    
    case 'showAlbumArtBg':
      albumBackgroundImage.css('display', val ? 'block' : 'none');
      foregroundContainer.css('background-color', val ? 'black' : 'transparent');
      break;

    case "bgBrightness":
      backgroundImage.css('opacity', val);
      albumBackgroundImage.css('opacity', val);
      break;

    case "bgBlur":
      backgroundImage.css('filter', `blur(${val}px)`);
      albumBackgroundImage.css('filter', `blur(${val}px)`);
      break;
  }
}

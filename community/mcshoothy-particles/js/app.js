var DEFAULT_CONFIG = {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800
      }
    },
    color: {
      value: '#ffffff'
    },
    shape: {
      type: 'circle',
      stroke: {
        width: 0,
        color: '#000000'
      },
      polygon: {
        nb_sides: 5
      },
      image: {
        src: 'img/github.svg',
        width: 100,
        height: 100
      }
    },
    opacity: {
      value: 0.5,
      random: false,
      anim: {
        enable: false,
        speed: 1,
        opacity_min: 0.1,
        sync: false
      }
    },
    size: {
      value: 5,
      random: true,
      anim: {
        enable: false,
        speed: 40,
        size_min: 0.1,
        sync: false
      }
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: '#ffffff',
      opacity: 0.4,
      width: 1
    },
    move: {
      enable: true,
      speed: 6,
      direction: 'none',
      random: false,
      straight: false,
      out_mode: 'out',
      bounce: false,
      attract: {
        enable: false,
        rotateX: 600,
        rotateY: 1200
      }
    }
  },
  interactivity: {
    detect_on: 'canvas',
    events: {
      onhover: {
        enable: true,
        mode: 'repulse'
      },
      onclick: {
        enable: true,
        mode: 'push'
      },
      resize: true
    },
    modes: {
      grab: {
        distance: 400,
        line_linked: {
          opacity: 1
        }
      },
      bubble: {
        distance: 400,
        size: 40,
        duration: 2,
        opacity: 8,
        speed: 3
      },
      repulse: {
        distance: 200
      },
      push: {
        particles_nb: 4
      },
      remove: {
        particles_nb: 2
      }
    }
  },
  retina_detect: true,
  config_demo: {
    hide_card: true,
    background_color: '#0e1116',
    background_image: '',
    background_position: '50% 50%',
    background_repeat: 'no-repeat',
    background_size: 'cover'
  }
};

var hoverModes = ['none', 'repulse', 'grab', 'bubble'];
var clickModes = ['none', 'push', 'repulse', 'bubble', 'remove'];
var shapeTypes = ['circle', 'edge', 'triangle', 'polygon', 'star'];
var directions = ['none', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left'];
var outModes = ['out', 'bounce'];
var presetNames = ['Balanced', 'Aurora', 'Nebula', 'Storm', 'Firefly', 'Snowfall', 'Neon Grid', 'Solar Wind'];
var presetConfigs = [
  {
    backgroundColor: '#0e1116',
    particleColor: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 0,
    particleCount: 80,
    densityEnabled: true,
    densityArea: 800,
    particleShape: 0,
    polygonSides: 5,
    particleSize: 5,
    sizeRandomness: true,
    sizeAnimEnabled: false,
    sizeAnimSpeed: 40,
    sizeAnimMin: 0.1,
    particleOpacity: 0.5,
    opacityRandomness: false,
    opacityAnimEnabled: false,
    opacityAnimSpeed: 1,
    opacityAnimMin: 0.1,
    particleSpeed: 6,
    moveRandomness: false,
    moveStraight: false,
    moveDirection: 0,
    outMode: 0,
    bounceParticles: false,
    linksEnabled: true,
    linkDistance: 150,
    linkColor: '#ffffff',
    linkOpacity: 0.4,
    linkWidth: 1,
    attractEnabled: false,
    attractRotateX: 600,
    attractRotateY: 1200,
    hoverEnabled: true,
    hoverMode: 1,
    grabDistance: 400,
    grabOpacity: 1,
    repulseDistance: 200,
    bubbleDistance: 400,
    bubbleSize: 40,
    bubbleOpacity: 0.8,
    bubbleDuration: 2,
    clickEnabled: true,
    clickMode: 1,
    pushCount: 4,
    removeCount: 2,
    retinaDetect: true
  },
  {
    backgroundColor: '#06131f',
    particleColor: '#7ee8fa',
    strokeColor: '#0b1e2d',
    strokeWidth: 0,
    particleCount: 120,
    densityEnabled: true,
    densityArea: 900,
    particleShape: 0,
    polygonSides: 5,
    particleSize: 3,
    sizeRandomness: true,
    sizeAnimEnabled: true,
    sizeAnimSpeed: 18,
    sizeAnimMin: 0.4,
    particleOpacity: 0.7,
    opacityRandomness: true,
    opacityAnimEnabled: true,
    opacityAnimSpeed: 1.4,
    opacityAnimMin: 0.2,
    particleSpeed: 2.5,
    moveRandomness: true,
    moveStraight: false,
    moveDirection: 0,
    outMode: 0,
    bounceParticles: false,
    linksEnabled: true,
    linkDistance: 115,
    linkColor: '#7ee8fa',
    linkOpacity: 0.45,
    linkWidth: 1,
    attractEnabled: false,
    attractRotateX: 600,
    attractRotateY: 1200,
    hoverEnabled: true,
    hoverMode: 2,
    grabDistance: 500,
    grabOpacity: 1,
    repulseDistance: 220,
    bubbleDistance: 420,
    bubbleSize: 50,
    bubbleOpacity: 0.7,
    bubbleDuration: 1.6,
    clickEnabled: true,
    clickMode: 1,
    pushCount: 3,
    removeCount: 2,
    retinaDetect: true
  },
  {
    backgroundColor: '#12071d',
    particleColor: '#c084fc',
    strokeColor: '#32124a',
    strokeWidth: 0,
    particleCount: 95,
    densityEnabled: true,
    densityArea: 700,
    particleShape: 3,
    polygonSides: 6,
    particleSize: 4,
    sizeRandomness: true,
    sizeAnimEnabled: true,
    sizeAnimSpeed: 24,
    sizeAnimMin: 0.25,
    particleOpacity: 0.4,
    opacityRandomness: true,
    opacityAnimEnabled: true,
    opacityAnimSpeed: 0.9,
    opacityAnimMin: 0.12,
    particleSpeed: 1.8,
    moveRandomness: true,
    moveStraight: false,
    moveDirection: 0,
    outMode: 0,
    bounceParticles: false,
    linksEnabled: true,
    linkDistance: 170,
    linkColor: '#f472b6',
    linkOpacity: 0.3,
    linkWidth: 0.9,
    attractEnabled: true,
    attractRotateX: 900,
    attractRotateY: 1800,
    hoverEnabled: true,
    hoverMode: 3,
    grabDistance: 360,
    grabOpacity: 0.9,
    repulseDistance: 260,
    bubbleDistance: 360,
    bubbleSize: 55,
    bubbleOpacity: 0.75,
    bubbleDuration: 1.8,
    clickEnabled: true,
    clickMode: 3,
    pushCount: 4,
    removeCount: 2,
    retinaDetect: true
  },
  {
    backgroundColor: '#030712',
    particleColor: '#7dd3fc',
    strokeColor: '#082f49',
    strokeWidth: 0,
    particleCount: 160,
    densityEnabled: true,
    densityArea: 1000,
    particleShape: 2,
    polygonSides: 5,
    particleSize: 2.5,
    sizeRandomness: true,
    sizeAnimEnabled: true,
    sizeAnimSpeed: 12,
    sizeAnimMin: 0.2,
    particleOpacity: 0.28,
    opacityRandomness: true,
    opacityAnimEnabled: true,
    opacityAnimSpeed: 1.8,
    opacityAnimMin: 0.08,
    particleSpeed: 8,
    moveRandomness: true,
    moveStraight: false,
    moveDirection: 0,
    outMode: 1,
    bounceParticles: true,
    linksEnabled: true,
    linkDistance: 95,
    linkColor: '#38bdf8',
    linkOpacity: 0.18,
    linkWidth: 0.8,
    attractEnabled: false,
    attractRotateX: 600,
    attractRotateY: 1200,
    hoverEnabled: true,
    hoverMode: 1,
    grabDistance: 400,
    grabOpacity: 0.9,
    repulseDistance: 280,
    bubbleDistance: 350,
    bubbleSize: 45,
    bubbleOpacity: 0.7,
    bubbleDuration: 1.4,
    clickEnabled: true,
    clickMode: 2,
    pushCount: 6,
    removeCount: 2,
    retinaDetect: true
  },
  {
    backgroundColor: '#071a12',
    particleColor: '#fef08a',
    strokeColor: '#3f6212',
    strokeWidth: 0,
    particleCount: 60,
    densityEnabled: true,
    densityArea: 650,
    particleShape: 0,
    polygonSides: 5,
    particleSize: 2.2,
    sizeRandomness: true,
    sizeAnimEnabled: true,
    sizeAnimSpeed: 20,
    sizeAnimMin: 0.2,
    particleOpacity: 0.85,
    opacityRandomness: true,
    opacityAnimEnabled: true,
    opacityAnimSpeed: 0.8,
    opacityAnimMin: 0.35,
    particleSpeed: 1.2,
    moveRandomness: true,
    moveStraight: false,
    moveDirection: 0,
    outMode: 0,
    bounceParticles: false,
    linksEnabled: false,
    linkDistance: 130,
    linkColor: '#fef08a',
    linkOpacity: 0.2,
    linkWidth: 1,
    attractEnabled: false,
    attractRotateX: 600,
    attractRotateY: 1200,
    hoverEnabled: true,
    hoverMode: 2,
    grabDistance: 450,
    grabOpacity: 1,
    repulseDistance: 180,
    bubbleDistance: 300,
    bubbleSize: 35,
    bubbleOpacity: 0.7,
    bubbleDuration: 1.5,
    clickEnabled: true,
    clickMode: 1,
    pushCount: 4,
    removeCount: 2,
    retinaDetect: true
  },
  {
    backgroundColor: '#0b1220',
    particleColor: '#e0f2fe',
    strokeColor: '#1e293b',
    strokeWidth: 0,
    particleCount: 135,
    densityEnabled: true,
    densityArea: 1200,
    particleShape: 0,
    polygonSides: 5,
    particleSize: 1.8,
    sizeRandomness: true,
    sizeAnimEnabled: false,
    sizeAnimSpeed: 30,
    sizeAnimMin: 0.1,
    particleOpacity: 0.92,
    opacityRandomness: false,
    opacityAnimEnabled: false,
    opacityAnimSpeed: 1,
    opacityAnimMin: 0.1,
    particleSpeed: 0.9,
    moveRandomness: true,
    moveStraight: false,
    moveDirection: 0,
    outMode: 0,
    bounceParticles: false,
    linksEnabled: false,
    linkDistance: 120,
    linkColor: '#e0f2fe',
    linkOpacity: 0.2,
    linkWidth: 0.8,
    attractEnabled: false,
    attractRotateX: 600,
    attractRotateY: 1200,
    hoverEnabled: false,
    hoverMode: 1,
    grabDistance: 400,
    grabOpacity: 1,
    repulseDistance: 200,
    bubbleDistance: 400,
    bubbleSize: 40,
    bubbleOpacity: 0.8,
    bubbleDuration: 2,
    clickEnabled: false,
    clickMode: 1,
    pushCount: 3,
    removeCount: 2,
    retinaDetect: true
  },
  {
    backgroundColor: '#050816',
    particleColor: '#00f5d4',
    strokeColor: '#312e81',
    strokeWidth: 0,
    particleCount: 110,
    densityEnabled: true,
    densityArea: 760,
    particleShape: 4,
    polygonSides: 5,
    particleSize: 3.5,
    sizeRandomness: true,
    sizeAnimEnabled: true,
    sizeAnimSpeed: 16,
    sizeAnimMin: 0.2,
    particleOpacity: 0.55,
    opacityRandomness: true,
    opacityAnimEnabled: true,
    opacityAnimSpeed: 1.2,
    opacityAnimMin: 0.15,
    particleSpeed: 4.5,
    moveRandomness: true,
    moveStraight: false,
    moveDirection: 0,
    outMode: 0,
    bounceParticles: false,
    linksEnabled: true,
    linkDistance: 92,
    linkColor: '#f15bb5',
    linkOpacity: 0.22,
    linkWidth: 1.1,
    attractEnabled: true,
    attractRotateX: 1500,
    attractRotateY: 2200,
    hoverEnabled: true,
    hoverMode: 3,
    grabDistance: 350,
    grabOpacity: 0.8,
    repulseDistance: 220,
    bubbleDistance: 420,
    bubbleSize: 48,
    bubbleOpacity: 0.85,
    bubbleDuration: 1.7,
    clickEnabled: true,
    clickMode: 1,
    pushCount: 5,
    removeCount: 2,
    retinaDetect: true
  },
  {
    backgroundColor: '#190a05',
    particleColor: '#ffb703',
    strokeColor: '#7c2d12',
    strokeWidth: 0,
    particleCount: 70,
    densityEnabled: true,
    densityArea: 850,
    particleShape: 2,
    polygonSides: 5,
    particleSize: 6,
    sizeRandomness: true,
    sizeAnimEnabled: true,
    sizeAnimSpeed: 22,
    sizeAnimMin: 0.35,
    particleOpacity: 0.62,
    opacityRandomness: true,
    opacityAnimEnabled: true,
    opacityAnimSpeed: 1.1,
    opacityAnimMin: 0.2,
    particleSpeed: 9,
    moveRandomness: true,
    moveStraight: false,
    moveDirection: 0,
    outMode: 0,
    bounceParticles: false,
    linksEnabled: true,
    linkDistance: 130,
    linkColor: '#fb8500',
    linkOpacity: 0.28,
    linkWidth: 1,
    attractEnabled: false,
    attractRotateX: 600,
    attractRotateY: 1200,
    hoverEnabled: true,
    hoverMode: 1,
    grabDistance: 380,
    grabOpacity: 1,
    repulseDistance: 260,
    bubbleDistance: 380,
    bubbleSize: 60,
    bubbleOpacity: 0.8,
    bubbleDuration: 1.3,
    clickEnabled: true,
    clickMode: 3,
    pushCount: 5,
    removeCount: 2,
    retinaDetect: true
  }
];

function applySetting(pJS, name, val) {
  switch (name) {
    // Appearance
    case 'backgroundColor':
      applyBackground(val);
      break;
    case 'particleColor':
      pJS.particles.color.value = val;
      break;
    case 'strokeColor':
      pJS.particles.shape.stroke.color = val;
      break;
    case 'strokeWidth':
      pJS.particles.shape.stroke.width = Number(val);
      break;

    // Particle Behavior
    case 'particleCount':
      pJS.particles.number.value = Number(val);
      break;
    case 'densityEnabled':
      pJS.particles.number.density.enable = !!val;
      break;
    case 'densityArea':
      pJS.particles.number.density.value_area = Number(val);
      break;
    case 'particleShape':
      pJS.particles.shape.type = shapeTypes[Number(val)] || 'circle';
      break;
    case 'polygonSides':
      pJS.particles.shape.polygon.nb_sides = Number(val);
      break;
    case 'particleSize':
      pJS.particles.size.value = Number(val);
      pJS.tmp.obj.size_value = Number(val);
      break;
    case 'sizeRandomness':
      pJS.particles.size.random = !!val;
      break;
    case 'sizeAnimEnabled':
      pJS.particles.size.anim.enable = !!val;
      break;
    case 'sizeAnimSpeed':
      pJS.particles.size.anim.speed = Number(val);
      pJS.tmp.obj.size_anim_speed = Number(val);
      break;
    case 'sizeAnimMin':
      pJS.particles.size.anim.size_min = Number(val);
      break;
    case 'particleOpacity':
      pJS.particles.opacity.value = Number(val);
      break;
    case 'opacityRandomness':
      pJS.particles.opacity.random = !!val;
      break;
    case 'opacityAnimEnabled':
      pJS.particles.opacity.anim.enable = !!val;
      break;
    case 'opacityAnimSpeed':
      pJS.particles.opacity.anim.speed = Number(val);
      break;
    case 'opacityAnimMin':
      pJS.particles.opacity.anim.opacity_min = Number(val);
      break;

    // Movement
    case 'particleSpeed':
      pJS.particles.move.speed = Number(val);
      pJS.tmp.obj.move_speed = Number(val);
      break;
    case 'moveRandomness':
      pJS.particles.move.random = !!val;
      break;
    case 'moveStraight':
      pJS.particles.move.straight = !!val;
      break;
    case 'moveDirection':
      pJS.particles.move.direction = directions[Number(val)] || 'none';
      break;
    case 'outMode':
      pJS.particles.move.out_mode = outModes[Number(val)] || 'out';
      break;
    case 'bounceParticles':
      pJS.particles.move.bounce = !!val;
      break;

    // Links & Attraction
    case 'linksEnabled':
      pJS.particles.line_linked.enable = !!val;
      break;
    case 'linkDistance':
      pJS.particles.line_linked.distance = Number(val);
      pJS.tmp.obj.line_linked_distance = Number(val);
      break;
    case 'linkColor':
      pJS.particles.line_linked.color = val;
      break;
    case 'linkOpacity':
      pJS.particles.line_linked.opacity = Number(val);
      break;
    case 'linkWidth':
      pJS.particles.line_linked.width = Number(val);
      pJS.tmp.obj.line_linked_width = Number(val);
      break;
    case 'attractEnabled':
      pJS.particles.move.attract.enable = !!val;
      break;
    case 'attractRotateX':
      pJS.particles.move.attract.rotateX = Number(val);
      break;
    case 'attractRotateY':
      pJS.particles.move.attract.rotateY = Number(val);
      break;

    // Hover Interaction
    case 'hoverEnabled':
      pJS.interactivity.events.onhover.enable = !!val;
      break;
    case 'hoverMode':
      pJS.interactivity.events.onhover.mode = hoverModes[Number(val)] || 'none';
      break;
    case 'grabDistance':
      pJS.interactivity.modes.grab.distance = Number(val);
      pJS.tmp.obj.mode_grab_distance = Number(val);
      break;
    case 'grabOpacity':
      pJS.interactivity.modes.grab.line_linked.opacity = Number(val);
      break;
    case 'repulseDistance':
      pJS.interactivity.modes.repulse.distance = Number(val);
      pJS.tmp.obj.mode_repulse_distance = Number(val);
      break;
    case 'bubbleDistance':
      pJS.interactivity.modes.bubble.distance = Number(val);
      pJS.tmp.obj.mode_bubble_distance = Number(val);
      break;
    case 'bubbleSize':
      pJS.interactivity.modes.bubble.size = Number(val);
      pJS.tmp.obj.mode_bubble_size = Number(val);
      break;
    case 'bubbleOpacity':
      pJS.interactivity.modes.bubble.opacity = Number(val);
      break;
    case 'bubbleDuration':
      pJS.interactivity.modes.bubble.duration = Number(val);
      break;

    // Click Interaction
    case 'clickEnabled':
      pJS.interactivity.events.onclick.enable = !!val;
      break;
    case 'clickMode':
      pJS.interactivity.events.onclick.mode = clickModes[Number(val)] || 'none';
      break;
    case 'pushCount':
      pJS.interactivity.modes.push.particles_nb = Number(val);
      break;
    case 'removeCount':
      pJS.interactivity.modes.remove.particles_nb = Number(val);
      break;
    case 'retinaDetect':
      pJS.retina_detect = !!val;
      break;

    default:
      return false;
  }

  return true;
}

function applyPreset(pJS, presetIndex) {
  var preset = presetConfigs[presetIndex] || presetConfigs[0];

  Object.keys(preset).forEach(function(key) {
    applySetting(pJS, key, preset[key]);
  });
}

particlesJS('particles-js', DEFAULT_CONFIG);
applyBackground(DEFAULT_CONFIG.config_demo.background_color);

function livelyPropertyListener(name, val) {
  var pJS = window.pJSDom && window.pJSDom[0] ? window.pJSDom[0].pJS : null;
  if (!pJS) {
    return;
  }

  if (name === 'wallpaperPreset') {
    applyPreset(pJS, Number(val));
    pJS.fn.particlesRefresh();
    return;
  }

  if (applySetting(pJS, name, val)) {
    pJS.fn.particlesRefresh();
  }
}

function applyBackground(color) {
  var container = document.getElementById('particles-js');
  if (container) {
    container.style.backgroundColor = color;
  }
  document.body.style.backgroundColor = color;
}
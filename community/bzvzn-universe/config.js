window.WallpaperConfig = {
    system: {
        showDebug: false,
        userMonitorMode: 0,      // 0: Auto, 1: Single, 2: Dual (Horiz), 3: Dual (Vert), 4: Triple, 5: 2x2, 6: Pyramid, 7: Inv Pyramid, 8: Custom
        userPerformanceMode: 2,  // 0: Low, 1: Mid, 2: High, 3:Extreme, 4: Custom
        bezelWidth: 40, //Default 40
        density: 2.0, //Default 2.0
    },
    camera: {
        x: 0, //Default 0
        y: 0, //Default 0
        z: 300, //Default 300

        fov: 50,  //Default 50

        maxRenderDistance: 5000,  //Default 5000

        parallaxIntensity: 15, //Default 15
        parallaxSpeed: 0.1, //Default 0.1

        rotationSpeed: 0.002 //Default 0.002
    },
    blackHole: [
        // Slot 1:
        {
            x: 0, y: 0, z: 0, //Default 0 0 0
            radius: 15, //Default 15
            tiltX: 0.35, tiltY: 0, tiltZ: 0, //Default 0.35 0 0
            rotationSpeed: 5.0, //Default 5.0
            colorInnerHalo: '#4422ff',  //Default #4422ff
            colorOuterHalo: '#ff5500',  //Default #ff5500
            colorDiskInner: '#ffffff', //Default #ffffff
            colorDiskMiddle: '#ff8800', //Default #ff8800
            colorDiskOuter: '#aa0000' //Default #aa0000
        },
        // Slot 2:
        {
            x: 0, y: 0, z: 0, //Default 0 0 0
            radius: 15, //Default 15
            tiltX: 0.25, tiltY: 0, tiltZ: -0.1, //Default 0.25 0 -0.1
            rotationSpeed: -1.2, //Default -1.2
            colorInnerHalo: '#4422ff', //Default #4422ff
            colorOuterHalo: '#ff5500',  //Default #ff5500
            colorDiskInner: '#ffffff', //Default #ffffff
            colorDiskMiddle: '#ff8800', //Default #ff8800
            colorDiskOuter: '#aa0000' //Default #aa0000
        },
        // Slot 3:
        {
            x: 0, y: 0, z: 0, //Default 0 0 0
            radius: 15, //Default 15
            tiltX: 0.5, tiltY: 0, tiltZ: -0.2, //Default 0.5 0 -0.2
            rotationSpeed: 1.2, //Default 1.2
            colorInnerHalo: '#4422ff', //Default #4422ff
            colorOuterHalo: '#ff5500', //Default #ff5500
            colorDiskInner: '#ffffff', //Default #ffffff
            colorDiskMiddle: '#ff8800', //Default #ff8800
            colorDiskOuter: '#aa0000' //Default #aa0000
        },
        // Slot 4:
        {
            x: 0, y: 0, z: 0, //Default 0 0 0
            radius: 15, //Default 15
            tiltX: 0.1, tiltY: 0, tiltZ: 0, //Default 0.1 0 0
            rotationSpeed: 0.5, //Default 0.5
            colorInnerHalo: '#4422ff', //Default #4422ff
            colorOuterHalo: '#ff5500', //Default #ff5500
            colorDiskInner: '#ffffff', //Default #ffffff
            colorDiskMiddle: '#ff8800', //Default #ff8800
            colorDiskOuter: '#aa0000' //Default #aa0000
        },
        // Slot 5:
        {
            x: 0, y: 0, z: 0, //Default 0 0 0
            radius: 15, //Default 15
            tiltX: -0.4, tiltY: 0, tiltZ: 0.3, //Default -0.4 0 0.3
            rotationSpeed: 1.5, //Default 1.5
            colorInnerHalo: '#4422ff', //Default #4422ff
            colorOuterHalo: '#ff5500', //Default #ff5500
            colorDiskInner: '#ffffff', //Default #ffffff
            colorDiskMiddle: '#ff8800', //Default #ff8800
            colorDiskOuter: '#aa0000' //Default #aa0000
        }
    ],
    universe: {
        starCount: 30000, //Default 30000
        maxRadius: 3000, //Default 3000

        typicalColors: [
            '#000000', //Default #000000
            '#fff4e8', //Default #fff4e8
            '#ffddaa', //Default #ffddaa
            '#ffaa88'  //Default #ffaa88
        ],
        blueGiantColor: '#4488ff', //Default #4488ff

        starSizeMin: 3, //Default 3
        starSizeMax: 13 //Default 13
    },
    nebulas: {
        cloudCount: 40, //Default 40
        maxRadius: 3000, //Default 3000
        colors: [
            '#aa44ff', //Default #aa44ff
            '#4488ff', //Default #4488ff
            '#ff44aa', //Default #ff44aa
            '#00ccff'  //Default #00ccff
        ],
        baseSizeMin: 800, //Default 800
        baseSizeMax: 2000, //Default 2000

        minDistToCamera: 600 //Default 600
    },
    galaxies: {
        count: 20, //Default 20
        placementRadius: 2000, //Default 2000

        armThickness: 1.0, //Default 1.0
        spiralCurvature: 1.0, //Default 1.0

        sizeMin: 80, //Default 80
        sizeMax: 200, //Default 200

        spiralRotationSpeed: 0.05, //Default 0.05

        themes: [
            [
                '#ffffff', //Default #ffffff
                '#66aaff', //Default #66aaff
                '#aa44ff'  //Default #aa44ff
            ],
            [
                '#ffffff', //Default #ffffff
                '#ff66cc', //Default #ff66cc
                '#6622cc'  //Default #6622cc
            ],
            [
                '#ffffff', //Default #ffffff
                '#44ffaa', //Default #44ffaa
                '#0066ff'  //Default #0066ff
            ],
            [
                '#ffffff', //Default #ffffff
                '#ffaa44', //Default #ffaa44
                '#ff44aa'  //Default #ff44aa
            ],
            [
                '#ffffff', //Default #ffffff
                '#aaddff', //Default #aaddff
                '#4466aa' //Default #4466aa
            ],
            [
                '#ffccaa', //Default #ffccaa
                '#ff2222', //Default #ff2222
                '#660000' //Default #660000
            ],
            [
                '#ffffff', //Default #ffffff
                '#00ffff', //Default #00ffff
                '#ff00ff' //Default #ff00ff
            ],
            [
                '#ffffff', //Default #ffffff
                '#ffcc22', //Default #ffcc22
                '#884400' //Default #884400
            ],
            [
                '#eaffcc', //Default #eaffcc
                '#55cc22', //Default #55cc22
                '#114400' //Default #114400
            ],
            [
                '#ddddff', //Default #ddddff
                '#4411aa', //Default #4411aa
                '#110022' //Default #110022
            ]
        ]
    }
};
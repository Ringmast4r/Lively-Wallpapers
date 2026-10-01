class Clock {
    constructor(angle1 = 0, angle2 = 0, coord_x = 0, coord_y = 0, size = 50, handle_color = "#000000") {
        this.angle1 = angle1;
        this.angle2 = angle2;
        this.coord_x = coord_x;
        this.coord_y = coord_y;
        this.size = size;
        this.handle_color = handle_color;
    }

    draw(ctx) {
        const clock_outer = 1;
        const clock_inner = 0.85;
        const handle = 0.65;
        const handle_thickness = (clock_outer-clock_inner)/2;

        ctx.beginPath();
        ctx.arc(this.coord_x, this.coord_y, this.size/2*clock_outer, 0, 2 * Math.PI);
        ctx.fillStyle = "#999999";
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.coord_x, this.coord_y, this.size/2*clock_inner, 0, 2 * Math.PI);
        ctx.fillStyle = "#444444"
        ctx.fill();
        ctx.closePath();

    
        const prevLineCap = ctx.lineCap;
        const prevStroke = ctx.strokeStyle;
        const prevLineWidth = ctx.lineWidth;

        let rad = (this.angle1 - 90)%360 * Math.PI / 180;
        let x2 = this.coord_x + Math.cos(rad) * this.size * 0.5 * handle;
        let y2 = this.coord_y + Math.sin(rad) * this.size * 0.5 * handle;

        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.strokeStyle = this.handle_color;
        ctx.lineWidth = Math.max(2, this.size * handle_thickness);
        ctx.moveTo(this.coord_x, this.coord_y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();

        rad = (this.angle2 - 90)%360 * Math.PI / 180;
        x2 = this.coord_x + Math.cos(rad) * this.size * 0.5 * handle;
        y2 = this.coord_y + Math.sin(rad) * this.size * 0.5 * handle;
        
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.strokeStyle = this.handle_color;
        ctx.lineWidth = Math.max(2, this.size * handle_thickness);
        ctx.moveTo(this.coord_x, this.coord_y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();

        ctx.lineCap = prevLineCap;
        ctx.strokeStyle = prevStroke;
        ctx.lineWidth = prevLineWidth;
    }
}



export class ClockChar {
    constructor(coord_x = 0, coord_y = 0, size = 50, color = "#000000") {
        this.coord_x = coord_x;
        this.coord_y = coord_y
        this.size = size;
        this.color = color;
        this.clocks = [
            new Clock(225, 225, coord_x-size, coord_y-size*2, size, color), new Clock(225, 225, coord_x, coord_y-size*2, size, color), new Clock(225, 225, coord_x+size, coord_y-size*2, size, color),  
            new Clock(225, 225, coord_x-size, coord_y-size, size, color), new Clock(225, 225, coord_x, coord_y-size, size, color), new Clock(225, 225, coord_x+size, coord_y-size, size, color), 
            new Clock(225, 225, coord_x-size, coord_y, size, color), new Clock(225, 225, coord_x, coord_y, size, color), new Clock(225, 225, coord_x+size, coord_y, size, color), 
            new Clock(225, 225, coord_x-size, coord_y+size, size, color), new Clock(225, 225, coord_x, coord_y+size, size, color), new Clock(225, 225, coord_x+size, coord_y+size, size, color),  
            new Clock(225, 225, coord_x-size, coord_y+size*2, size, color), new Clock(225, 225, coord_x, coord_y+size*2, size, color), new Clock(225, 225, coord_x+size, coord_y+size*2, size, color)
        ];
    }

    draw(ctx) {
        for (let clock of this.clocks) {
            clock.draw(ctx);
        }
    }

    reset() {
        for (let clock of this.clocks) {
            clock.angle1 = 225;
            clock.angle2 = 225;
        }
    }

    update_clock_pos(new_x, new_y) {
        this.coord_x = new_x; 
        this.coord_y = new_y;

        let x = -1;
        let y = -2;

        for (let clock of this.clocks) {
            clock.coord_x = this.coord_x + this.size*x;
            clock.coord_y = this.coord_y + this.size*Math.floor(y);

            x = (x+2)%3-1;
            if (x == -1) {
                y = (y+3)%5-2;
            }
        }
    }

    update_handle_color(handle_color) {
        this.color = handle_color;
        for (let clock of this.clocks) {
            clock.handle_color = handle_color
        }
    }

    update_clock_size(ClockSize) {
        this.size = ClockSize;

        let x = -1;
        let y = -2;

        for (let clock of this.clocks) {
            clock.size = ClockSize;

            clock.coord_x = this.coord_x + this.size*x;
            clock.coord_y = this.coord_y + this.size*Math.floor(y);

            x = (x+2)%3-1;
            if (x == -1) {
                y = (y+3)%5-2;
            }
        }
    }

    set(char) {
        let patterns = {
            " ": [225, 225],
            "│": [0, 180],
            "─": [90, 270],
            "╱": [45, 225],
            "╲": [135, 315],
            "┌": [90, 180],
            "┐": [180, 270],
            "┘": [270, 0],
            "└": [0, 90],
            "╴": [270, 270],
            "╵": [0, 0],
            "╶": [90, 90],
            "╷": [180, 180],
            "<": [45, 135],
            ">": [225, 315]
        };

        let chars = {
            "0": [
                "┌─┐",
                "│ │",
                "│ │",
                "│ │",
                "└─┘"
            ],
            "1": [
                "  ╷",
                "  │",
                "  │",
                "  │",
                "  ╵"
            ],
            "2": [
                "╶─┐",
                "  │",
                "┌─┘",
                "│  ",
                "└─╴"
            ],
            "3": [
                "╶─┐",
                "  │",
                "╶─│",
                "  │",
                "╶─┘"
            ],
            "4": [
                "╷ ╷",
                "│ │",
                "└─│",
                "  │",
                "  ╵"
            ],
            "5": [
                "┌─╴",
                "│ ",
                "└─┐",
                "  │",
                "╶─┘"
            ],
            "6": [
                "┌─╴",
                "│ ",
                "│─┐",
                "│ │",
                "└─┘"
            ],
            "7": [
                "──┐",
                "  │",
                "  │",
                "  │",
                "  ╵"
            ],
            "8": [
                "┌─┐",
                "│ │",
                "│─│",
                "│ │",
                "└─┘"
            ],
            "9": [
                "┌─┐",
                "│ │",
                "└─│",
                "  │",
                "╶─┘"
            ],
        };

        this.reset();

        if (char in chars) {
            const char_pattern = chars[char];
            
            for (let row = 0; row < char_pattern.length; row++) {
                const line = char_pattern[row];
                for (let col = 0; col < line.length; col++) {
                    const symbol = line[col];
                    const angles = patterns[symbol];
                    
                    const idx = 3 * row + col;
                    
                    this.clocks[idx].angle1 = angles[0];
                    this.clocks[idx].angle2 = angles[1];
                }
            }
        }
    }
}
// Получаем ссылку на элемент canvas и контекст WebGL2
const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
	throw new Error("WebGL2 is now supported");
}

function createShader(shaderType, sourceCode) {
	const shader = gl.createShader(shaderType);
	gl.shaderSource(shader, sourceCode.trim());
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error(gl.getShaderInfoLog(shader));
	}

	return shader;
}

const program = gl.createProgram();
const vertexShader = createShader(gl.VERTEX_SHADER, document.getElementById("vertex").textContent);
const fragmentShader = createShader(gl.FRAGMENT_SHADER, document.getElementById("fragment").textContent);

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	throw new Error(gl.getProgramInfoLog(program));
}

gl.useProgram(program);

const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
const vertexBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "position");

gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const iResolutionUniform = gl.getUniformLocation(program, 'iResolution');
const iTimeUniform = gl.getUniformLocation(program, "iTime");
const iColorSurfaceUniform = gl.getUniformLocation(program, "iColorSurface");
const iColorPrimaryUniform = gl.getUniformLocation(program, "iColorPrimary");

let primaryColor = {r: 1.0, g: 1.0, b: 1.0};
let surfaceColor = {r: 0.0, g: 0.0, b: 0.0};

function resizeCanvas() {
	const width = window.innerWidth;
	const height = window.innerHeight;

	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width;
		canvas.height = height;
		gl.viewport(0, 0, width, height);
		gl.uniform2f(iResolutionUniform, width, height);
	}
}

window.onload = () => {
	resizeCanvas();
};

window.onresize = () => {
	resizeCanvas();
};

function livelyPropertyListener(name, val) {
	switch (name) {
		case "visualizerColor":
			primaryColor = hexToRgb(val);
			break;
		case "backgroundColor":
			surfaceColor = hexToRgb(val);
			break;
	}
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16) / 255,
		g: parseInt(result[2], 16) / 255,
		b: parseInt(result[3], 16) / 255
	} : null;
}

function render(time) {
	gl.uniform1f(iTimeUniform, time * 0.001); // конвертируем миллисекунды в секунды
	gl.uniform4f(iColorSurfaceUniform, surfaceColor.r, surfaceColor.g, surfaceColor.b, 1.0);
	gl.uniform4f(iColorPrimaryUniform, primaryColor.r, primaryColor.g, primaryColor.b, 1.0);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / 2);
	requestAnimationFrame(render);
}

requestAnimationFrame(render);

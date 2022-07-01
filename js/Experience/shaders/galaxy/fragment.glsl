uniform float uTime;
uniform vec4 uResolution;

varying vec2 vUv;
varying vec3 vPosition;

float PI = 3.141592653589793238;

void main()	{
	gl_FragColor = vec4(vUv, 0., 1.);
}
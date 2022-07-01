uniform float uTime;
uniform vec4 uResolution;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vPosition;

float PI = 3.141592653589793238;

void main()	{
	vec4 particleTexture = texture2D(uTexture, vUv);

	gl_FragColor = vec4(vec3(1.0), particleTexture.r);
}
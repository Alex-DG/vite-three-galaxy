uniform float uTime;
uniform vec3 uColor;
uniform vec4 uResolution;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vPosition;


void main()	{
	vec4 particleTexture = texture2D(uTexture, vUv);

	float distanceToCenter = distance(gl_PointCoord, vec2(0.45));
    float strength = 0.05 / distanceToCenter - 0.1;

	gl_FragColor = vec4(uColor, particleTexture.r * strength);
}
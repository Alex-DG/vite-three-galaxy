uniform float uTime;
uniform vec2 uPixels;

varying vec2 vUv;
varying vec3 vPosition;

attribute vec3 aPositions;

float PI = 3.141592653589793238;

float particleSpread = 0.025;

void main() {
  // Calculate particles mesh position
  vec3 particlesPosition = (modelMatrix * vec4(aPositions, 1.0)).xyz;

  // Add position
  vec4 viewPosition = viewMatrix * vec4(particlesPosition, 1.0);
  viewPosition.xyz += position * particleSpread;

  gl_Position = projectionMatrix * viewPosition;
   
  vUv = position.xy + vec2(0.5);
}
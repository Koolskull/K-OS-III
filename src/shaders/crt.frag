// ☦ Blessed be these pixels. ☦
// CRT Shader - scanlines, curvature, phosphor glow
// For the DATAMOSHPIT Visual Machine Interface

precision mediump float;

uniform sampler2D tDiffuse;
uniform float time;
uniform vec2 resolution;
uniform float scanlineIntensity;
uniform float curvature;
uniform float vignetteStrength;

varying vec2 vUv;

vec2 curveUV(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(curvature);
    uv = uv + uv * offset * offset;
    uv = uv * 0.5 + 0.5;
    return uv;
}

void main() {
    vec2 uv = curveUV(vUv);

    // Out of bounds = black
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    vec4 color = texture2D(tDiffuse, uv);

    // Scanlines
    float scanline = sin(uv.y * resolution.y * 3.14159) * scanlineIntensity;
    color.rgb -= scanline * 0.08;

    // Phosphor RGB sub-pixels
    float px = mod(gl_FragCoord.x, 3.0);
    if (px < 1.0) color.gb *= 0.85;
    else if (px < 2.0) color.rb *= 0.85;
    else color.rg *= 0.85;

    // Vignette
    vec2 vigUv = uv * (1.0 - uv.yx);
    float vig = vigUv.x * vigUv.y * 15.0;
    vig = pow(vig, vignetteStrength);
    color.rgb *= vig;

    // Slight flicker
    color.rgb *= 0.98 + 0.02 * sin(time * 8.0);

    gl_FragColor = color;
}

import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec4 uTerm;
uniform float uTime;
uniform float uMotion;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec4 over(vec4 dst, vec4 src) {
  float a = src.a + dst.a * (1.0 - src.a);
  vec3 rgb = (src.rgb * src.a + dst.rgb * dst.a * (1.0 - src.a)) / max(a, 0.0001);
  return vec4(rgb, a);
}

vec2 pageUv(vec2 fragTop) {
  return (fragTop - uTerm.xy) / max(uTerm.zw, vec2(1.0));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 fragTop = vec2(frag.x, uResolution.y - frag.y);
  float t = uTime;
  vec4 acc = vec4(0.0);

  vec2 local = pageUv(fragTop);
  float grain = noise(fragTop * 0.45 + t * 18.0 * uMotion);
  float slice = floor(local.y * 86.0);
  float burst = step(0.975, hash(vec2(floor(t * 2.4), 4.1))) * uMotion;
  float bandPick = hash(vec2(floor(t * 6.0), 8.0));
  float band = smoothstep(0.018, 0.0, abs(local.y - bandPick)) * burst;

  float wobble = sin(t * 0.17) * 7.0 * uMotion;
  float bend = sin(fragTop.x * 0.0035 + t * 0.21) * (5.0 + 3.0 * sin(t * 0.11));
  float yy = fragTop.y + wobble + bend * uMotion + (grain - 0.5) * 1.4;
  float scanA = sin(yy * 0.82);
  float scanB = sin(yy * 0.82 * 1.055 - t * 0.47);
  float moire = scanA * scanB;
  float line = smoothstep(-0.15, 0.85, scanA);
  vec3 dmg = vec3(0.565, 0.690, 0.557);
  vec3 dim = vec3(0.271, 0.384, 0.329);
  acc = over(acc, vec4(0.0, 0.0, 0.0, (1.0 - line) * 0.07));
  acc = over(acc, vec4(dim, (0.5 + 0.5 * moire) * 0.03));
  acc = over(acc, vec4(dmg, line * (0.5 + 0.5 * moire) * 0.02));

  float speckle = hash(fragTop + fract(t * 48.0) * 120.0);
  acc = over(acc, vec4(vec3(speckle), 0.025));

  if (band > 0.01) {
    vec3 vhs = vec3(0.95, 0.28, 0.48);
    vhs.b += 0.35 * step(0.5, hash(vec2(slice, 2.0)));
    vhs.r += 0.25 * step(0.5, hash(vec2(slice, 3.0)));
    acc = over(acc, vec4(vhs, band * 0.5));
    acc = over(acc, vec4(0.25, 0.85, 0.95, band * 0.22));
  }

  vec2 p = vUv * 2.0 - 1.0;
  float vig = smoothstep(1.2, 0.2, length(p * vec2(1.02, 0.9)));
  float edge = smoothstep(0.78, 1.08, length(p));
  vec3 glow = dmg * (0.22 + 0.08 * line) * vig;
  glow += vec3(0.50, 0.78, 0.52) * edge * 0.55;
  acc = over(acc, vec4(glow, 0.05 * vig + edge * 0.08));
  acc = over(acc, vec4(0.0, 0.0, 0.0, edge * 0.1));

  gl_FragColor = acc;
}
`;

function mountCrtInner() {
  if (document.querySelector("canvas.crt-veil")) return null;

  const canvas = document.createElement("canvas");
  canvas.className = "crt-veil";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.setProperty("position", "fixed", "important");
  canvas.style.setProperty("inset", "0", "important");
  canvas.style.setProperty("width", "100vw", "important");
  canvas.style.setProperty("height", "100vh", "important");
  canvas.style.setProperty("pointer-events", "none", "important");
  canvas.style.setProperty("z-index", "40", "important");
  canvas.style.setProperty("background", "transparent", "important");
  canvas.style.setProperty("image-rendering", "auto", "important");
  document.body.append(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTerm: { value: new THREE.Vector4(0, 0, 1, 1) },
    uTime: { value: 0 },
    uMotion: { value: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1 },
  };
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms,
    vertexShader,
    fragmentShader,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  function termRect() {
    const node = document.querySelector(".term") || document.querySelector("canvas#view") || document.body;
    const rect = node.getBoundingClientRect();
    const dpr = renderer.getPixelRatio();
    uniforms.uTerm.value.set(rect.left * dpr, rect.top * dpr, Math.max(rect.width, 1) * dpr, Math.max(rect.height, 1) * dpr);
    uniforms.uResolution.value.set(canvas.width, canvas.height);
  }

  resize();
  const clock = new THREE.Clock();
  let frame = 0;
  function tick() {
    frame = requestAnimationFrame(tick);
    if (document.hidden) return;
    uniforms.uTime.value += clock.getDelta();
    if (canvas.width !== Math.floor(window.innerWidth * renderer.getPixelRatio()) || canvas.height !== Math.floor(window.innerHeight * renderer.getPixelRatio())) {
      resize();
    }
    termRect();
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(tick);

  return {
    stop() {
      cancelAnimationFrame(frame);
      renderer.dispose();
      material.dispose();
      canvas.remove();
    },
  };
}

export function mountCrt() {
  try {
    return mountCrtInner();
  } catch (error) {
    console.warn("CRT filter did not start", error);
    return null;
  }
}

if (document.body?.dataset?.crt === "on") mountCrt();

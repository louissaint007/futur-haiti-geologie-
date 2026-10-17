import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const textureFiles = {
  volcano: 'volcanic-ash-v2', basalt: 'volcanic-basalt', lava: 'lava',
  granite: 'granite', sandstone: 'sandstone', gneiss: 'gneiss',
};
const textureLoader = new THREE.TextureLoader();
function texture(kind) {
  const extension = kind === 'volcano' ? 'jpg' : 'png';
  const map = textureLoader.load(`/textures/${textureFiles[kind] || textureFiles.volcano}.${extension}`);
  map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  const tiling = kind === 'lava' ? 1.25 : kind === 'volcano' ? 3.2 : kind === 'granite' ? 1.7 : kind === 'gneiss' ? 1.4 : 1.8;
  map.repeat.set(tiling, tiling);
  return map;
}

function material(kind, roughness = 0.94) {
  const map = texture(kind);
  const options = { map, bumpMap: map, bumpScale: kind === 'lava' ? 0.13 : kind === 'volcano' ? 0.035 : 0.075, roughness };
  if (kind === 'lava') Object.assign(options, { emissive: new THREE.Color('#ff5815'), emissiveMap: map, emissiveIntensity: 0.9 });
  return new THREE.MeshStandardMaterial(options);
}
function mesh(geometry, mat, parent, position = [0, 0, 0], scale) {
  const item = new THREE.Mesh(geometry, mat); item.position.set(...position); if (scale) item.scale.set(...scale); parent.add(item); return item;
}
function line(points, color, radius, parent) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 5), radius, 8, false), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.38, roughness: 0.42 }), parent);
}
function label(text, parent, position, color = '#eee1ca') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 112;
  const ctx = canvas.getContext('2d');
  ctx.beginPath(); ctx.roundRect(4, 8, 504, 96, 22); ctx.fillStyle = 'rgba(17,19,16,0.94)'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(220,176,112,0.78)'; ctx.stroke();
  ctx.font = '700 25px Arial'; ctx.letterSpacing = '2px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.shadowColor = '#000'; ctx.shadowBlur = 5; ctx.fillText(text.toUpperCase(), 256, 56, 470);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, depthTest: false })); sprite.position.set(...position); const width = Math.min(4.2, 2.0 + text.length * 0.12); sprite.scale.set(width, width * 0.22, 1); parent.add(sprite);
}
function surfaceRibbon(points, width, mat, parent) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const samples = curve.getPoints(72), positions = [], uvs = [], indices = [];
  samples.forEach((point, i) => {
    const tangent = curve.getTangentAt(i / (samples.length - 1));
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const taper = Math.sin(Math.PI * (0.12 + 0.82 * i / (samples.length - 1))) * 0.65 + 0.35;
    for (const sign of [-1, 1]) {
      const v = point.clone().addScaledVector(side, sign * width * taper * 0.5); v.y += 0.025;
      positions.push(v.x, v.y, v.z); uvs.push(i / (samples.length - 1), sign * 0.5 + 0.5);
    }
    if (i < samples.length - 1) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const flow = mesh(geometry, mat, parent); flow.material.side = THREE.DoubleSide; return flow;
}
function makePlate(parent, { x, oceanic, name, convergent = false, divergent = false }) {
  const group = new THREE.Group(); group.position.x = x; parent.add(group);
  const width = 4.8, depth = 5.2, cols = 26, rows = 22, positions = [], uvs = [], indices = [];
  group.userData.convergent = convergent;
  const elevation = (u, v) => {
    const edgeDimple = Math.sin(v * Math.PI * 6 + (oceanic ? 1 : 0)) * 0.06;
    const ridge = divergent
      ? 0.78 * Math.exp(-(((u - (x < 0 ? 0.94 : 0.06)) ** 2) / 0.012)) + 0.08 * Math.sin(v * 3 + u * 5)
      : oceanic ? 0.12 * Math.sin(u * 4 + v * 2) : 0.62 * Math.exp(-((u - 0.86) ** 2) / 0.018) + 0.16 * Math.sin(v * 3 + u * 5);
    const subduction = oceanic && group.userData.convergent ? -0.8 * Math.exp(-((u - 0.06) ** 2) / 0.025) : 0;
    const broadRelief = 0.13 * Math.sin(u * 5.2 + v * 3.1) + 0.09 * Math.cos(v * 7.3 - u * 2.4);
    return (oceanic ? -0.02 : 0.16) + ridge + edgeDimple + subduction + broadRelief;
  };
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    const u = i / cols, v = j / rows, x0 = (u - 0.5) * width, z0 = (v - 0.5) * depth;
    const boundaryWobble = Math.sin(v * Math.PI * 7) * 0.075;
    const px = x0 + ((i === 0 || i === cols) ? boundaryWobble : 0);
    positions.push(px, elevation(u, v), z0); uvs.push(u * 2, v * 2);
    if (i < cols && j < rows) { const a = j * (cols + 1) + i, b = a + cols + 1; indices.push(a, b, a + 1, b, b + 1, a + 1); }
  }
  const topGeometry = new THREE.BufferGeometry(); topGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); topGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); topGeometry.setIndex(indices); topGeometry.computeVertexNormals();
  mesh(topGeometry, material(oceanic ? 'sandstone' : 'gneiss', 0.98), group);
  // Build the exposed lithosphere as irregular strata following the same
  // warped perimeter as the surface, instead of a rectangular box underneath.
  const perimeter = [];
  for (let i = 0; i <= cols; i++) perimeter.push([i / cols, 0]);
  for (let i = 1; i <= rows; i++) perimeter.push([1, i / rows]);
  for (let i = cols - 1; i >= 0; i--) perimeter.push([i / cols, 1]);
  for (let i = rows - 1; i > 0; i--) perimeter.push([0, i / rows]);
  const bandColors = oceanic ? ['#705644', '#463b32', '#8a684b', '#4b4037', '#66503d'] : ['#b4865e', '#755540', '#c09263', '#59493c', '#8c6445'];
  bandColors.forEach((color, layer) => {
    const bandPositions = [], bandIndices = [], topDrop = layer * 0.22, bottomDrop = (layer + 1) * 0.22;
    perimeter.forEach(([u, v]) => {
      const edgeRipple = Math.sin(v * Math.PI * 9 + u * 17) * 0.035 + Math.sin(u * 23 - v * 11) * 0.018;
      const px = (u - 0.5) * width + ((u === 0 || u === 1) ? Math.sin(v * Math.PI * 6) * 0.075 : 0);
      const pz = (v - 0.5) * depth + ((v === 0 || v === 1) ? Math.sin(u * Math.PI * 7) * 0.07 : 0);
      const top = elevation(u, v) - topDrop + edgeRipple;
      const bottom = elevation(u, v) - bottomDrop + edgeRipple * 0.55;
      bandPositions.push(px, top, pz, px, bottom, pz);
    });
    for (let i = 0; i < perimeter.length; i++) {
      const a = i * 2, b = ((i + 1) % perimeter.length) * 2;
      bandIndices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const bandGeometry = new THREE.BufferGeometry();
    bandGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bandPositions, 3));
    bandGeometry.setIndex(bandIndices); bandGeometry.computeVertexNormals();
    const band = mesh(bandGeometry, new THREE.MeshStandardMaterial({ color, roughness: 0.98, side: THREE.DoubleSide }), group);
    band.material.side = THREE.DoubleSide;
  });
  group.userData.oceanic = oceanic; group.userData.elevation = elevation; group.userData.name = name;
  group.userData.restPosition = group.position.clone();
  return group;
}
function buildVolcano(group, showLabels = true) {
  // Broad stratovolcano edifice, subtly irregular flanks and a concave summit bowl.
  const profile = [[4.55, -3.18], [4.32, -2.9], [3.95, -2.45], [3.48, -1.8], [2.98, -1.05], [2.47, -0.2], [2.0, 0.55], [1.62, 1.2], [1.3, 1.66], [1.08, 1.88], [1.14, 1.96], [1.0, 1.86], [0.84, 1.58], [0.58, 1.38], [0.24, 1.34], [0, 1.34]];
  const denseProfile = [];
  for (let i = 0; i < profile.length - 1; i++) for (let step = 0; step < 4; step++) {
    const t = step / 4; denseProfile.push([THREE.MathUtils.lerp(profile[i][0], profile[i + 1][0], t), THREE.MathUtils.lerp(profile[i][1], profile[i + 1][1], t)]);
  }
  denseProfile.push(profile.at(-1));
  const vertices = [], uvs = [], indices = [], segments = 192;
  for (let j = 0; j < denseProfile.length; j++) for (let i = 0; i <= segments; i++) {
    const a = i / segments * Math.PI * 2, [r, y] = denseProfile[j];
    // A real stratovolcano is not a perfect lathed cone: radial gullies,
    // overlapping deposits and a breached, uneven summit break the silhouette.
    const broadRidge = Math.sin(a * 2.3 + 0.45) * 0.34 + Math.sin(a * 5.1 - 0.8) * 0.16 + Math.cos(a * 8.2 + 1.7) * 0.08;
    const gullies = Math.sin(a * 13.7 + j * 0.31) * 0.055 + Math.sin(a * 24.2 - j * 0.17) * 0.026;
    const sector = (angle, center) => Math.atan2(Math.sin(angle - center), Math.cos(angle - center));
    const collapse = Math.exp(-(sector(a, 0.78) ** 2) / 0.2);
    const upper = THREE.MathUtils.smoothstep(y, 0.72, 1.96);
    const roughness = (broadRidge + gullies + collapse * upper * 0.32) * Math.min(1, r * 0.75);
    const lean = THREE.MathUtils.smoothstep(y, -3.18, 2.04) * 0.36;
    const brokenRim = collapse * upper * 0.74 + Math.sin(a * 4.1 + 0.6) * upper * 0.16;
    const flankRelief = Math.sin(a * 11 + y * 2.1) * Math.sin(y * 1.1 + a * 2.4) * 0.075;
    vertices.push(Math.cos(a) * (r + roughness) + lean, y - brokenRim + flankRelief, Math.sin(a) * (r + roughness));
    uvs.push(i / segments, j / (denseProfile.length - 1));
  }
  for (let j = 0; j < denseProfile.length - 1; j++) for (let i = 0; i < segments; i++) { const a = j * (segments + 1) + i, b = a + segments + 1; indices.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices); geo.computeVertexNormals();
  const cone = mesh(geo, material('volcano'), group); cone.material.side = THREE.DoubleSide;
  // Incised gullies and broken ash/lava benches interrupt the smooth cone
  // silhouette and make it read as a weathered stratovolcano.
  const gullyMat = new THREE.MeshStandardMaterial({ color: '#382b22', roughness: 1, transparent: true, opacity: 0.72 });
  [0.85, 1.55, 2.18].forEach((angle, channel) => {
    const points = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18, y = 1.55 - t * 4.25, r = 1.2 + t * 2.8;
      const a = angle + Math.sin(t * 7 + channel) * 0.075;
      const rough = Math.sin(a * 5.1 - 0.8) * 0.14 + Math.cos(a * 8.2 + 1.7) * 0.06;
      points.push([Math.cos(a) * (r + rough) + t * 0.35, y, Math.sin(a) * (r + rough)]);
    }
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    mesh(new THREE.TubeGeometry(curve, 72, 0.038, 6, false), gullyMat, group);
  });
  for (const [height, radius, start, end] of [[-1.72, 3.35, 0.1, 3.0], [-2.48, 4.05, 0.18, 2.95]]) {
    const benchPoints = [];
    for (let i = 0; i <= 70; i++) {
      const a = start + (end - start) * i / 70;
      const y = height + Math.sin(a * 3.2 + height) * 0.085 + Math.sin(a * 8.4) * 0.035;
      const r = radius + Math.sin(a * 5.2) * 0.12;
      benchPoints.push(new THREE.Vector3(Math.cos(a) * r + 0.28, y, Math.sin(a) * r));
    }
    const bench = new THREE.CatmullRomCurve3(benchPoints);
    mesh(new THREE.TubeGeometry(bench, 160, 0.026, 5, false), new THREE.MeshStandardMaterial({ color: '#514233', roughness: 1 }), group);
  }
  const craterFloor = mesh(new THREE.CircleGeometry(0.3, 64), new THREE.MeshStandardMaterial({ color: '#241a16', roughness: 1, emissive: '#35170d', emissiveIntensity: 0.1 }), group, [0.16, 1.22, 0]); craterFloor.rotation.x = -Math.PI / 2;
  // The main vent is an exposed, dark rock shaft in the teaching cutaway, not a lava pillar.
  mesh(new THREE.CylinderGeometry(0.18, 0.58, 3.0, 48), new THREE.MeshStandardMaterial({ color: '#49362a', roughness: 1 }), group, [0.08, -1.55, -0.03]);
  const flowPoints = [[0.42, 1.63, 1.08], [0.72, 1.05, 1.46], [0.38, 0.42, 1.95], [0.82, -0.28, 2.48], [0.45, -1.08, 3.02], [0.86, -2.0, 3.62], [0.2, -2.87, 4.1]];
  const crustedFlow = new THREE.MeshStandardMaterial({ map: texture('volcano'), bumpMap: texture('volcano'), bumpScale: 0.035, color: '#b2a184', emissive: '#281b10', emissiveIntensity: 0.16, roughness: 1 });
  surfaceRibbon(flowPoints, 0.46, crustedFlow, group);
  const lavaMat = new THREE.MeshStandardMaterial({ map: texture('lava'), emissive: new THREE.Color('#ff4a12'), emissiveMap: texture('lava'), emissiveIntensity: 1.15, roughness: 0.75 });
  const lavaStream = surfaceRibbon(flowPoints.map(([x, y, z]) => [x + 0.035, y + 0.065, z - 0.045]), 0.2, lavaMat, group);
  const lavaCore = surfaceRibbon(flowPoints.map(([x, y, z]) => [x + 0.04, y + 0.082, z - 0.045]), 0.055, new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.9 }), group);
  group.userData.lava = [lavaMat, lavaStream, lavaCore];
  const secondaryFlows = [];
  for (const points of [
    [[-0.52, 1.58, -1.08], [-0.88, 0.92, -1.5], [-0.55, 0.22, -2.03], [-1.03, -0.62, -2.66], [-0.64, -1.7, -3.35], [-1.0, -2.65, -3.95]],
    [[0.72, 1.42, -0.88], [1.02, 0.75, -1.25], [0.8, 0.08, -1.95], [1.15, -0.82, -2.63], [0.9, -1.75, -3.34], [1.32, -2.72, -3.9]],
  ]) {
    const flowGroup = new THREE.Group(); group.add(flowGroup); flowGroup.visible = false;
    const under = new THREE.MeshStandardMaterial({ map: texture('volcano'), color: '#b2a184', emissive: '#281b10', emissiveIntensity: 0.4, roughness: 1 });
    const hot = new THREE.MeshStandardMaterial({ map: texture('lava'), emissive: new THREE.Color('#ff4a12'), emissiveMap: texture('lava'), emissiveIntensity: 1.8, roughness: 0.75 });
    surfaceRibbon(points, 0.38, under, flowGroup);
    surfaceRibbon(points.map(([x,y,z]) => [x, y + 0.075, z]), 0.18, hot, flowGroup);
    secondaryFlows.push(flowGroup);
  }
  group.userData.secondaryFlows = secondaryFlows;
  const smoke = new THREE.Group(); group.add(smoke);
  const puffCanvas = document.createElement('canvas'); puffCanvas.width = puffCanvas.height = 64;
  const puffCtx = puffCanvas.getContext('2d'), puffGradient = puffCtx.createRadialGradient(32, 32, 2, 32, 32, 31);
  puffGradient.addColorStop(0, 'rgba(206,199,184,0.44)'); puffGradient.addColorStop(0.35, 'rgba(160,155,146,0.23)'); puffGradient.addColorStop(0.72, 'rgba(120,117,111,0.10)'); puffGradient.addColorStop(1, 'rgba(95,93,89,0)');
  puffCtx.fillStyle = puffGradient; puffCtx.fillRect(0, 0, 64, 64);
  const puffMap = new THREE.CanvasTexture(puffCanvas);
  const ashPuffs = [];
  for (let i = 0; i < 52; i++) {
    const progress = (i % 26) / 25, angle = i * 2.399, radius = (0.12 + progress * 0.72) * (0.35 + ((i * 17) % 19) / 19);
    const puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffMap, color: '#b7b2a8', transparent: true, opacity: 0.24, depthWrite: false, blending: THREE.NormalBlending }));
    puff.userData = { angle, radius, progress, phase: (i % 26) / 26, size: 0.42 + progress * 0.66 };
    puff.scale.set(puff.userData.size, puff.userData.size * 0.8, 1); smoke.add(puff); ashPuffs.push(puff);
  }
  group.userData.ashPuffs = ashPuffs;
  group.userData.smoke = smoke;
  const emberGeometry = new THREE.SphereGeometry(0.045, 8, 6);
  const emberMaterial = new THREE.MeshBasicMaterial({ color: '#ffb23e', toneMapped: false });
  const embers = [];
  for (let i = 0; i < 28; i++) {
    const ember = mesh(emberGeometry, emberMaterial, group); ember.visible = false;
    ember.userData = { angle: i * 2.399, phase: (i * 0.618) % 1, reach: 1.5 + (i % 5) * 0.45 };
    embers.push(ember);
  }
  group.userData.embers = embers;
  const eruptionGlow = new THREE.PointLight('#ff4814', 0, 9, 1.5); eruptionGlow.position.set(0.15, 1.45, 0.05); group.add(eruptionGlow); group.userData.eruptionGlow = eruptionGlow;
  if (showLabels) {
    label('Cratère', group, [2.25, 2.42, 0.1]); label('Conduit magmatique', group, [-1.8, -1.35, 0.15]); label('Réservoir magmatique', group, [1.65, -2.15, 0.15], '#ffb16e');
  }
}
function buildPlates(group, boundary) {
  const mantle = mesh(new THREE.SphereGeometry(1, 72, 40), new THREE.MeshStandardMaterial({ color: '#694333', roughness: 0.98 }), group, [0, -1.7, 0], [5.8, 1.35, 3.45]);
  mantle.material.color.set('#694333');
  const positions = boundary === 'Divergente' ? [-2.67, 2.67] : boundary === 'Convergente' ? [-2.3, 2.3] : [-2.4, 2.4];
  const left = makePlate(group, { x: positions[0], oceanic: boundary === 'Divergente', name: boundary === 'Divergente' ? 'océanique' : 'continentale', divergent: boundary === 'Divergente' });
  const right = makePlate(group, { x: positions[1], oceanic: true, name: 'océanique', convergent: boundary === 'Convergente', divergent: boundary === 'Divergente' });
  if (boundary === 'Divergente') {
    const riftMat = new THREE.MeshStandardMaterial({ color: '#211814', roughness: 1 });
    mesh(new THREE.BoxGeometry(0.13, 0.13, 3.8), riftMat, group, [0, 0.71, 0]);
    line([[-0.12, 0.77, -1.85], [-0.08, 0.83, -0.8], [0.02, 0.82, 0.2], [-0.06, 0.78, 1.25], [0, 0.74, 1.85]], '#b75b34', 0.055, group);
  } else if (boundary === 'Convergente') {
    right.rotation.z = 0.22; right.position.y = -0.08;
    // The descending oceanic slab is loaded from the USGS Slab2 depth grid.
    const trench = line([[-0.62, -0.12, -2.0], [-0.38, -0.02, -1.0], [-0.32, -0.08, 0.0], [-0.42, -0.12, 1.0], [-0.65, -0.18, 2.0]], '#30241e', 0.09, group);
    trench.material.emissive.set('#211a15'); trench.material.emissiveIntensity = 0.05;
    const arc = new THREE.Group(); group.add(arc); arc.position.set(-1.12, 0.86, -0.52); arc.scale.setScalar(0.34); buildVolcano(arc, false);
  } else {
    right.position.z = 0.38; right.rotation.y = 0.1; left.position.z = -0.25; left.rotation.y = -0.08;
  }
  const arrowColor = 0xffd08a;
  const addMotionArrow = (plate, origin, direction) => {
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(...direction).normalize(), new THREE.Vector3(...origin), 1.25, arrowColor, 0.34, 0.24);
    arrow.line.material.depthTest = false; arrow.cone.material.depthTest = false;
    arrow.line.material.transparent = true; arrow.line.material.opacity = 0.95;
    arrow.cone.material.transparent = true; arrow.cone.material.opacity = 0.95;
    plate.add(arrow);
  };
  if (boundary === 'Divergente') {
    addMotionArrow(left, [1.0, 1.22, -1.05], [-1, 0, 0]); addMotionArrow(right, [-1.0, 1.22, 1.05], [1, 0, 0]);
  } else if (boundary === 'Convergente') {
    addMotionArrow(left, [0.45, 1.25, -1.05], [1, 0, 0]); addMotionArrow(right, [-0.55, 1.2, 1.1], [-1, -0.12, 0]);
  } else {
    addMotionArrow(left, [1.25, 1.1, 0.2], [0, 0, 1]); addMotionArrow(right, [-1.25, 1.1, -0.2], [0, 0, -1]);
  }
  group.userData.plates = [left, right];
}
function buildSedimentaryBlock(group) {
  // Each bed is a shallow 3D terrain volume: folded bedding, uneven ground and
  // an exposed front section make this read as an outcrop rather than a layer cake.
  const colors = ['#76583f', '#ae895e', '#675447', '#c4a477', '#86664a', '#bd9c6b', '#5c5744'];
  const base = -2.72, thickness = 0.48, halfWidth = 3.45, halfDepth = 2.15, cols = 42, rows = 28;
  const warp = (x, z, layer) => {
    const edgeX = THREE.MathUtils.smoothstep(Math.abs(x) / halfWidth, 0.72, 0.98);
    const edgeZ = THREE.MathUtils.smoothstep(Math.abs(z) / halfDepth, 0.72, 0.98);
    return [
      x + Math.sign(x) * edgeX * (Math.sin(z * 1.5 + layer * 0.8) * 0.15 + Math.sin(z * 4.3 - layer) * 0.045),
      z + Math.sign(z) * edgeZ * (Math.sin(x * 1.1 - layer * 0.7) * 0.11 + Math.cos(x * 3.2 + layer) * 0.035),
    ];
  };
  const horizon = (layer, x, z) => base + layer * thickness + layer * 0.12 * (x / halfWidth)
    + Math.sin(x * 0.62 + layer * 0.45) * 0.15 + Math.sin(x * 1.34 - layer * 0.3) * 0.055
    + Math.sin(z * 0.8 + layer * 0.43) * Math.cos(x * 0.55) * 0.17
    + Math.sin(z * 1.7 + x * 0.6 + layer) * 0.07
    + Math.sin(x * 3.8 + z * 2.1 + layer * 0.8) * 0.025
    - 0.48 * Math.exp(-((x - 0.2) ** 2) / 2.2) * (0.45 + layer * 0.045);
  for (let i = 0; i < colors.length; i++) {
    const positions = [], uvs = [], indices = [];
    const addFace = (verts) => {
      const start = positions.length / 3;
      verts.forEach(([x, y, z, u, v]) => { positions.push(x, y, z); uvs.push(u, v); });
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    };
    const topStart = 0;
    for (let j = 0; j <= rows; j++) for (let k = 0; k <= cols; k++) {
      const x0 = -halfWidth + 2 * halfWidth * k / cols, z0 = -halfDepth + 2 * halfDepth * j / rows, [x, z] = warp(x0, z0, i + 1);
      positions.push(x, horizon(i + 1, x0, z0), z); uvs.push(k / cols * 5, j / rows * 4);
    }
    const topCount = (rows + 1) * (cols + 1);
    for (let j = 0; j < rows; j++) for (let k = 0; k < cols; k++) {
      const a = topStart + j * (cols + 1) + k, b = a + cols + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const bottomStart = positions.length / 3;
    for (let j = 0; j <= rows; j++) for (let k = 0; k <= cols; k++) {
      const x0 = -halfWidth + 2 * halfWidth * k / cols, z0 = -halfDepth + 2 * halfDepth * j / rows, [x, z] = warp(x0, z0, i);
      positions.push(x, horizon(i, x0, z0), z); uvs.push(k / cols * 5, j / rows * 4);
    }
    for (let j = 0; j < rows; j++) for (let k = 0; k < cols; k++) {
      const a = bottomStart + j * (cols + 1) + k, b = a + cols + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const side = (x1, z1, x2, z2, u1, v1, u2, v2) => {
      const [tx1,tz1] = warp(x1,z1,i + 1), [tx2,tz2] = warp(x2,z2,i + 1), [bx1,bz1] = warp(x1,z1,i), [bx2,bz2] = warp(x2,z2,i);
      const t1 = horizon(i + 1, x1, z1), t2 = horizon(i + 1, x2, z2), b1 = horizon(i, x1, z1), b2 = horizon(i, x2, z2);
      addFace([[tx1,t1,tz1,u1,v1],[tx2,t2,tz2,u2,v1],[bx2,b2,bz2,u2,v2],[bx1,b1,bz1,u1,v2]]);
    };
    for (let k = 0; k < cols; k++) {
      const x1 = -halfWidth + 2 * halfWidth * k / cols, x2 = -halfWidth + 2 * halfWidth * (k + 1) / cols;
      side(x1, halfDepth, x2, halfDepth, k / cols, 0, (k + 1) / cols, 1);
      side(x2, -halfDepth, x1, -halfDepth, k / cols, 0, (k + 1) / cols, 1);
    }
    for (let j = 0; j < rows; j++) {
      const z1 = -halfDepth + 2 * halfDepth * j / rows, z2 = -halfDepth + 2 * halfDepth * (j + 1) / rows;
      side(-halfWidth, z2, -halfWidth, z1, j / rows, 0, (j + 1) / rows, 1);
      side(halfWidth, z1, halfWidth, z2, j / rows, 0, (j + 1) / rows, 1);
    }
    const bed = new THREE.BufferGeometry(); bed.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); bed.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); bed.setIndex(indices); bed.computeVertexNormals();
    const bedMaterial = new THREE.MeshStandardMaterial({ map: texture('sandstone'), bumpMap: texture('sandstone'), bumpScale: 0.055, color: colors[i], roughness: 0.98 });
    bedMaterial.side = THREE.DoubleSide;
    mesh(bed, bedMaterial, group);
  }
  label('Couches récentes', group, [-2.35, 1.45, 0], '#fff0cc');
  label('Enfouissement', group, [2.55, -0.95, 2.2], '#fff0cc');
  label('Strates anciennes', group, [0, -2.72, -1.9], '#fff0cc');
}
function buildRocks(group, rock) {
  const kinds = { Granite: 'granite', Basalte: 'basalt', Grès: 'sandstone', Gneiss: 'gneiss' };
  const textureType = kinds[rock] || 'granite';
  const shape = new THREE.IcosahedronGeometry(1.55, 5);
  const pos = shape.attributes.position;
  for (let i = 0; i < pos.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pos, i); const n = 1 + Math.sin(v.x * 8 + v.y * 3) * 0.045 + Math.sin(v.z * 13 - v.y * 4) * 0.03; pos.setXYZ(i, v.x * n, v.y * n, v.z * n); }
  shape.computeVertexNormals();
  const stoneMaterial = material(textureType);
  const sample = mesh(shape, stoneMaterial, group, [-1.35, 0.05, 0]); sample.rotation.set(0.24, 0.35, -0.12); sample.scale.set(1.15, 0.98, 0.87);
  const chips = Array.from({ length: 8 }, (_, i) => { const geom = new THREE.DodecahedronGeometry(0.45 + (i % 3) * 0.12, 1); const item = mesh(geom, stoneMaterial, group, [1.45 + (i % 3) * 0.25, -0.8 + Math.floor(i / 3) * 0.63, 0.4 + ((i * 7) % 4) * 0.38]); item.rotation.set(i * 0.7, i * 0.4, i * 0.22); return item; });
  if (rock === 'Granite') {
    const mineralGeo = new THREE.SphereGeometry(1, 6, 5), mineralColors = ['#c9bda7', '#d5c6a9', '#453b32', '#b2694c'], dummy = new THREE.Object3D();
    mineralColors.forEach((color) => { const flecks = new THREE.InstancedMesh(mineralGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.9 }), 60); for (let i = 0; i < 60; i++) { const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); const size = 0.018 + Math.random() * 0.025; dummy.position.copy(v.multiplyScalar(1.02)); dummy.scale.set(size * 1.6, size * 0.7, size); dummy.updateMatrix(); flecks.setMatrixAt(i, dummy.matrix); } sample.add(flecks); });
  }
  const plinth = mesh(new THREE.CylinderGeometry(2.1, 2.25, 0.25, 80), new THREE.MeshStandardMaterial({ color: '#292a25', roughness: 0.65 }), group, [0, -1.82, 0]); plinth.material.metalness = 0.12;
  group.userData.rocks = [sample, ...chips]; label(rock, group, [-1.35, 1.95, 0]);
}

function addJsonSurface(data, parent, { color, textureKind, depthTint = false } = {}) {
  const geometry = new THREE.BufferGeometry();
  const [cols, rows] = data.dimensions;
  const positions = Array.from(data.positions);
  const indices = Array.from(data.indices);
  if (textureKind === 'volcano') {
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i], y = positions[i + 1], z = positions[i + 2];
      const radius = Math.hypot(x, z);
      // Start the merge at the cone's actual foot and spread it across the
      // surrounding slope; avoid a circular tabletop around the edifice.
      const blend = THREE.MathUtils.smoothstep(radius, 3.25, 7.4);
      const edgeBlend = THREE.MathUtils.smoothstep(Math.max(Math.abs(x), Math.abs(z)), 5.8, 6.98);
      const coneFoot = -3.18 + 0.035 * Math.sin(x * 2.3 + z * 1.7);
      const merged = THREE.MathUtils.lerp(coneFoot, y, blend);
      // The source DEM is square; feather its outer grid cells back to ground
      // level so the relief reads as terrain, not as a raised display plinth.
      positions[i + 1] = THREE.MathUtils.lerp(merged, -4.1, edgeBlend);
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const uvs = new Float32Array(cols * rows * 2);
  const colors = depthTint ? new Float32Array(cols * rows * 3) : null;
  const minY = Math.min(...data.positions.filter((_, index) => index % 3 === 1));
  const maxY = Math.max(...data.positions.filter((_, index) => index % 3 === 1));
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const index = j * cols + i, y = data.positions[index * 3 + 1];
    uvs[index * 2] = i / Math.max(cols - 1, 1) * 8;
    uvs[index * 2 + 1] = j / Math.max(rows - 1, 1) * 8;
    if (colors) {
      const depth = THREE.MathUtils.clamp((y - minY) / Math.max(maxY - minY, 0.001), 0, 1);
      const tint = new THREE.Color().setHSL(0.055 + depth * 0.12, 0.25 + depth * 0.15, 0.28 + depth * 0.14);
      colors.set([tint.r, tint.g, tint.b], index * 3);
    }
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  if (colors) geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  if (textureKind === 'volcano') {
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const map = textureKind ? texture(textureKind) : null;
  const surfaceMaterial = new THREE.MeshStandardMaterial({
    color: color || '#b79770', map, roughness: 0.98, side: THREE.DoubleSide,
    vertexColors: Boolean(colors), bumpMap: map, bumpScale: textureKind === 'volcano' ? 0.035 : 0.06,
  });
  const surface = mesh(geometry, surfaceMaterial, parent);
  surface.receiveShadow = true;
  return surface;
}

function fitModelToScene(model, targetSize = 5.8) {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const dimensions = bounds.getSize(new THREE.Vector3());
  const maxDimension = Math.max(dimensions.x, dimensions.y, dimensions.z) || 1;
  model.scale.setScalar(targetSize / maxDimension);
  model.updateMatrixWorld(true);
  const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  model.position.sub(center);
}

export default function GeologyScene({ mode, boundary, speed, playing, intense = false, selectedRock, orbitApiRef }) {
  const hostRef = useRef(null), controlsRef = useRef(null), sceneRef = useRef(null), clockRef = useRef(0);
  const liveRef = useRef({ speed, playing, intense }); liveRef.current = { speed, playing, intense };
  useEffect(() => {
    const host = hostRef.current; if (!host) return undefined;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#171a16'); scene.fog = new THREE.Fog('#171a16', 12, 28); sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100); camera.position.set(8.3, 5.1, 9.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.055; controls.enableRotate = true; controls.enableZoom = true; controls.enablePan = true; controls.screenSpacePanning = true; controls.zoomSpeed = 0.85; controls.panSpeed = 0.85; controls.minDistance = 4; controls.maxDistance = 22; controls.maxPolarAngle = Math.PI * 0.92; controls.target.set(0, 0, 0); controlsRef.current = controls;
    if (orbitApiRef) orbitApiRef.current = {
      zoomIn: () => controls.dollyIn(0.8),
      zoomOut: () => controls.dollyOut(0.8),
      reset: () => controls.reset(),
    };
    scene.add(new THREE.HemisphereLight('#d5d4bc', '#353026', 2.15));
    const key = new THREE.DirectionalLight('#ffe0b1', 3.1); key.position.set(-5, 8, 7); scene.add(key);
    const fill = new THREE.PointLight('#e2723c', 21, 17, 2); fill.position.set(4, 2, -5); scene.add(fill);
    const ground = mesh(new THREE.CircleGeometry(mode === 'volcano' ? 11 : 7, 112), new THREE.MeshStandardMaterial({ color: mode === 'volcano' ? '#62533e' : '#22231e', roughness: 1 }), scene, [0, -3.28, 0]); ground.rotation.x = -Math.PI / 2;
    const group = new THREE.Group(); scene.add(group);
    if (mode === 'volcano') { buildVolcano(group); group.scale.setScalar(0.8); }
    else if (mode === 'plates') { buildPlates(group, boundary); group.scale.setScalar(0.68); }
    else if (mode === 'sediments') { buildSedimentaryBlock(group); }
    else buildRocks(group, selectedRock);
    let cancelled = false;
    let fossilDecoder;
    if (mode === 'volcano') {
      fetch('/models/volcano/mount-st-helens-dem.json').then((response) => {
        if (!response.ok) throw new Error(`DEM local indisponible (${response.status})`);
        return response.json();
      }).then((data) => { if (!cancelled) addJsonSurface(data, group, { color: '#b2a184', textureKind: 'volcano' }); }).catch(() => {});
    }
    if (mode === 'plates' && boundary === 'Convergente') {
      fetch('/models/tectonics/cocos-slab2-mesh.json').then((response) => {
        if (!response.ok) throw new Error(`Géométrie USGS indisponible (${response.status})`);
        return response.json();
      }).then((data) => {
        if (!cancelled) {
          const slab = addJsonSurface(data, group, { color: '#c58855', depthTint: true });
          slab.material.emissive = new THREE.Color('#3e1f12');
          slab.material.emissiveIntensity = 0.14;
          group.userData.slab = slab;
        }
      }).catch(() => {});
    }
    if (mode === 'sediments') {
      const loader = new GLTFLoader();
      fossilDecoder = new DRACOLoader();
      fossilDecoder.setDecoderPath('/draco/');
      loader.setDRACOLoader(fossilDecoder);
      loader.load('/models/fossils/cerro-ballena-mpc-677.glb', (asset) => {
        if (cancelled) return;
        const fossilSite = asset.scene;
        fitModelToScene(fossilSite, 5.5);
        fossilSite.position.y = 0.52;
        fossilSite.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
        group.add(fossilSite);
        label('Cerro Ballena · Miocène', group, [0, 3.45, 0], '#f1d9a8');
      }, undefined, (error) => { console.error('Échec de chargement du scan 3D local de Cerro Ballena.', error); if (!cancelled) label('Scan 3D indisponible', group, [0, 0, 0], '#ef9272'); });
    }
    scene.userData.model = group; scene.userData.ground = ground;
    const stars = new THREE.BufferGeometry(), dust = []; for (let i = 0; i < 90; i++) dust.push((Math.random() - 0.5) * 22, Math.random() * 11 - 3, (Math.random() - 0.5) * 22);
    stars.setAttribute('position', new THREE.Float32BufferAttribute(dust, 3)); scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: '#a69a80', size: 0.035, transparent: true, opacity: 0.35 })));
    const resize = () => { const width = Math.max(host.clientWidth, 1), height = Math.max(host.clientHeight, 1); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    let frame; const animate = () => { frame = requestAnimationFrame(animate);
      if (mode === 'volcano' && group.userData.smoke) {
        const t = performance.now() * 0.001 * (liveRef.current.playing ? liveRef.current.speed : 0);
        const burst = liveRef.current.intense;
        group.userData.ashPuffs?.forEach((puff) => {
          const { angle, radius, progress, phase, size } = puff.userData, drift = (phase + t * (0.13 - progress * 0.035)) % 1;
          const spread = (radius + drift * (burst ? 1.25 : 0.62)) * (burst ? 1.38 : 1);
          puff.position.set(Math.cos(angle + t * 0.08) * spread + Math.sin(t + angle) * 0.1, 1.95 + drift * (burst ? 7.0 : 4.4), Math.sin(angle + t * 0.08) * spread);
          const puffSize = size * (0.7 + drift * (burst ? 1.6 : 1.05)) * (burst ? 1.24 : 1); puff.scale.set(puffSize, puffSize * 0.82, 1);
          puff.material.opacity = Math.min(0.64, (0.22 + Math.sin(drift * Math.PI) * 0.12) * (1 - drift * 0.45) * (burst ? 1.8 : 1));
        });
        group.userData.secondaryFlows?.forEach((flow) => { flow.visible = burst; });
        group.userData.embers?.forEach((ember) => {
          ember.visible = burst;
          if (burst) {
            const { angle, phase, reach } = ember.userData, flight = (phase + t * 0.72) % 1;
            const radius = 0.22 + flight * reach;
            ember.position.set(Math.cos(angle) * radius, 1.62 + Math.sin(flight * Math.PI) * (2.1 + reach * 0.55) - flight * 0.65, Math.sin(angle) * radius);
            const scale = 0.65 + Math.sin(flight * Math.PI) * 0.75; ember.scale.setScalar(scale);
          }
        });
        group.userData.eruptionGlow.intensity = burst ? 22 + Math.sin(t * 7) * 8 : 0;
        const pulse = (liveRef.current.playing ? 0.8 + Math.sin(t * 2.5) * 0.22 : 0.8) * (burst ? 2.6 : 1);
        if (group.userData.lava) {
          group.userData.lava[0].emissiveIntensity = pulse;
          group.userData.lava[2].material.opacity = pulse * 0.88;
          if (group.userData.lava[0].map) group.userData.lava[0].map.offset.x = (t * 0.025) % 1;
        }
      }
      if (mode === 'plates' && group.userData.plates) {
        const [left, right] = group.userData.plates;
        if (liveRef.current.playing) {
          const t = performance.now() * 0.001 * liveRef.current.speed, travel = Math.sin(t * 0.32) * 0.36;
          left.position.copy(left.userData.restPosition); right.position.copy(right.userData.restPosition);
          if (boundary === 'Divergente') { left.position.x -= travel; right.position.x += travel; }
          if (boundary === 'Convergente') { left.position.x += travel * 0.72; right.position.x -= travel * 0.72; right.position.y -= Math.max(0, travel) * 0.2; if (group.userData.slab) group.userData.slab.position.y = -Math.max(0, travel) * 0.17; }
          if (boundary === 'Transformante') { left.position.z += travel; right.position.z -= travel; }
        }
      }
      controls.update(); renderer.render(scene, camera); };
    animate();
    return () => { cancelled = true; fossilDecoder?.dispose(); cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); if (orbitApiRef) orbitApiRef.current = null; renderer.dispose(); if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement); scene.traverse((object) => { object.geometry?.dispose(); if (Array.isArray(object.material)) object.material.forEach((m) => { m.map?.dispose(); m.dispose(); }); else if (object.material) { object.material.map?.dispose(); object.material.dispose(); } }); };
  }, [mode, boundary, selectedRock]);
  return <div ref={hostRef} className="three-host" role="img" aria-label={`Scène 3D pédagogique : ${mode === 'volcano' ? 'volcan' : mode === 'plates' ? 'tectonique des plaques' : mode === 'sediments' ? 'strates sédimentaires et fossilisation' : `échantillon de ${selectedRock}`}. Glissez pour faire tourner le modèle.`} />;
}

import * as THREE from "three";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { spawnItem, removeItem, moveItem, scaleItem } from "./spawn.js";
import { drawCard } from "./cards.js";

const canvas = document.getElementById("c"), $ = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
const scene = new THREE.Scene();
const bg = document.createElement("canvas"); bg.width = 4; bg.height = 256;
{ const g = bg.getContext("2d"), s = g.createLinearGradient(0, 0, 0, 256); s.addColorStop(0, "#0b0d16"); s.addColorStop(.55, "#12142a"); s.addColorStop(1, "#05060a"); g.fillStyle = s; g.fillRect(0, 0, 4, 256); }
const bgTex = new THREE.CanvasTexture(bg); bgTex.colorSpace = THREE.SRGBColorSpace; scene.background = bgTex;
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100); camera.position.set(0, 4.2, 9);
const controls = new OrbitControls(camera, canvas); controls.target.set(0, 1, 0); controls.maxPolarAngle = Math.PI / 2 - 0.05; controls.update();
scene.add(new THREE.HemisphereLight(0xbfc8ff, 0x10121f, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(4, 8, 5); scene.add(sun);
const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ color: 0x151833, roughness: 1 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
scene.add(new THREE.GridHelper(28, 28, 0x2b2f45, 0x1d2040));

let catalog = [], items = [], counter = 0, selected = null;
const meshes = new Map(), texCache = new Map();
const byId = (id) => catalog.find((p) => p.id === id);
const status = (t) => { $("status").textContent = t; };

function tex(p) {
  if (!texCache.has(p.id)) { const t = new THREE.CanvasTexture(drawCard(p)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; texCache.set(p.id, t); }
  return texCache.get(p.id);
}
function build(it) {
  const p = byId(it.productId), poster = p.kind === "poster";
  const w = poster ? 1.5 : 1.3, h = poster ? 1.9 : 1.6, d = poster ? 0.06 : 0.22;
  const g = new THREE.Group(); g.userData.uid = it.uid;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w + .12, h + .12, d), new THREE.MeshStandardMaterial({ color: poster ? 0x15151a : 0x2a3050, roughness: .6 })));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex(p), roughness: .85 }));
  face.position.z = d / 2 + 0.001; g.add(face); g.userData.h = h; return g;
}
function sync() {
  const live = new Set(items.map((i) => i.uid));
  for (const [uid, m] of meshes) if (!live.has(uid)) { scene.remove(m); meshes.delete(uid); }
  for (const it of items) {
    let m = meshes.get(it.uid); if (!m) { m = build(it); meshes.set(it.uid, m); scene.add(m); }
    m.scale.setScalar(it.scale); m.position.set(it.x, m.userData.h * it.scale / 2, it.z); m.rotation.y = it.rotY;
  }
  status(`${items.length} in the void${selected ? " · selected: " + byId(items.find((i) => i.uid === selected)?.productId)?.title.slice(0, 40) : ""}`);
}
function setSelected(uid) { selected = uid; for (const [u, m] of meshes) { const p = byId(items.find((i) => i.uid === u).productId); m.children[0].material.color.setHex(u === uid ? 0x9db0ff : p.kind === "poster" ? 0x15151a : 0x2a3050); } }

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
function aim(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); }
function pick(e) { aim(e); const h = ray.intersectObjects([...meshes.values()], true)[0]; let o = h?.object; while (o && !o.userData.uid) o = o.parent; return o?.userData.uid ?? null; }
let drag = null;
canvas.addEventListener("pointerdown", (e) => { const uid = pick(e); setSelected(uid); sync(); if (uid) { drag = uid; controls.enabled = false; canvas.setPointerCapture(e.pointerId); } });
canvas.addEventListener("pointermove", (e) => { if (!drag) return; aim(e); if (ray.ray.intersectPlane(plane, hit)) { items = moveItem(items, drag, hit.x, hit.z); sync(); } });
const endDrag = () => { drag = null; controls.enabled = true; };
canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("wheel", (e) => { const uid = pick(e); if (!uid) return; e.preventDefault(); const it = items.find((i) => i.uid === uid); items = scaleItem(items, uid, it.scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); sync(); }, { passive: false });
window.addEventListener("keydown", (e) => { if ((e.key === "Delete" || e.key === "Backspace") && selected && document.activeElement.tagName !== "INPUT") { items = removeItem(items, selected); selected = null; sync(); } });

function spawn(p) { items = spawnItem(items, p, counter++); setSelected(items[items.length - 1].uid); sync(); }
function renderList() {
  const q = $("filter").value.toLowerCase(), ul = $("list"); ul.textContent = "";
  for (const p of catalog.filter((p) => p.title.toLowerCase().includes(q))) {
    const li = document.createElement("li"), b = document.createElement("b"); b.textContent = "$" + Number(p.price).toFixed(2);
    li.append(b, document.createTextNode(p.title)); li.onclick = () => spawn(p); ul.appendChild(li);
  }
}
function setCatalog(c) {
  const ok = (c?.products ?? c)?.filter?.((p) => p && p.id && p.title && Number.isFinite(+p.price));
  if (!ok?.length) { status("Catalogue needs a products array with id, title and price."); return false; }
  catalog = ok; items = []; counter = 0; selected = null; texCache.clear(); sync(); renderList(); return true;
}
$("filter").oninput = renderList;
$("clear").onclick = () => { items = []; counter = 0; selected = null; sync(); };
$("shot").onclick = () => { renderer.render(scene, camera); canvas.toBlob((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "constructs-arrangement.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }); };
$("file").onchange = async (e) => { try { if (setCatalog(JSON.parse(await e.target.files[0].text()))) status(`Loaded ${catalog.length} products.`); } catch (x) { status("Could not read that file as JSON."); } };

function resize() { const r = canvas.getBoundingClientRect(); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
window.__constructs = { spawn, get items() { return items; }, get catalog() { return catalog; } };

fetch("data/catalog.json").then((r) => r.json()).then((c) => { setCatalog(c); status(`${catalog.length} sample products. Click one.`); }).catch(() => status("Could not load data/catalog.json - serve the folder over http (python3 -m http.server)."));

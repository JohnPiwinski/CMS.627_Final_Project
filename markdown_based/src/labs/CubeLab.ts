import * as THREE from 'three';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mirrorNormals, solidMesh, type Solid } from '../lib/solids';
import { reflectionMatrix } from '../lib/symmetry';
import type { Feature } from '../lib/features';

type Pickable = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
const COLORS: Record<Feature, number> = { face:0x6c8fb1, edge:0xb68b4a, vertex:0xe37862 };

export class CubeLab {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42,1,.1,100);
  private readonly renderer: THREE.WebGLRenderer | SVGRenderer;
  private readonly surface = document.createElement('div');
  private readonly controls: OrbitControls;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly pickables: Pickable[] = [];
  private readonly cube = new THREE.Group();
  private readonly observer: ResizeObserver;
  private frame = 0;
  private readonly overlay = document.createElement('div');
  private solid: Solid = 'Tetrahedron';
  private mirrors: THREE.Vector3[] = [];
  private readonly mirrorChoices: { mesh: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
    normal: THREE.Vector3; rim: THREE.LineLoop<THREE.BufferGeometry, THREE.LineBasicMaterial>;
    button: HTMLButtonElement }[] = [];
  private mirrorPreview: number | null = null;
  private mode: 'rotate' | 'reflect' = 'rotate';
  private motion: ((now: number) => void) | null = null;
  private pointerDragged = false;
  private pointerStart: {x:number;y:number}|null=null;
  private hovered: Pickable|null=null;
  private selected: Pickable|null=null;
  private performed = new Set<Feature>();
  private currentTask: Feature = 'face';
  private tracked: { type: Feature; index: number } | null = null;
  private visited = new Set<number>();
  private focusPalette = false;
  private readonly baseColors = new WeakMap<Pickable, THREE.Color>();
  private marks: {type: Feature; index: number; color: number}[] = [];
  private trackingEnabled = false;
  private choosingFeature = false;
  private inspectionOnly = false;
  private allowed = new Set<Feature>();
  private orbitEnabled = true;
  private canTransform = false;
  onOrbit: () => void = () => {};
  onPick: (feature: Feature) => void = () => {};
  onSymmetry: (mode: 'rotate' | 'reflect') => void = () => {};

  configure(features: Feature[], orbit: boolean, transform: boolean): void {
    if (this.canTransform || transform) this.closeDial();
    this.allowed = new Set(features);
    this.orbitEnabled = orbit;
    this.controls.enabled = orbit && !this.motion;
    this.canTransform = transform;
  }

  onTrack: (type: Feature, index: number) => void = () => {};
  onMoveStart?: (before: THREE.Matrix4, after: THREE.Matrix4) => void;
  onMoveProgress?: (progress: number) => void;
  private positionLabels: { point: THREE.Vector3; element: HTMLSpanElement }[] = [];
  onTransform: (matrix: THREE.Matrix4) => void = () => {};
  onSelected: (type: Feature) => void = () => {};
  onHint: (hint: string) => void = () => {};

  constructor(private readonly host: HTMLElement, renderer: THREE.WebGLRenderer | SVGRenderer) {
    this.currentTask = (['face','edge','vertex'] as const).find(f=>!this.performed.has(f)) ?? 'vertex';
    this.renderer = renderer;
    this.surface.className = 'three-canvas';
    this.surface.setAttribute('aria-label', 'Interactive Platonic solid. Drag to orbit. Select a feature to transform the solid.');
    this.surface.append(this.renderer.domElement);
    host.appendChild(this.surface);
    this.scene.add(new THREE.HemisphereLight(0xf9f4ec,0xb3b5b7,2.3));
    const directional = new THREE.DirectionalLight(0xffffff,2.6);
    directional.position.set(-3,7,8);
    this.scene.add(directional);
    const fill = new THREE.DirectionalLight(0xc8d9f5,.8);
    fill.position.set(5,0,-5);
    this.scene.add(fill);
    this.scene.add(this.cube);
    this.cube.matrixAutoUpdate = false;
    this.makeSolid();
    this.overlay.className = 'symmetry-overlay';
    this.overlay.hidden = true;
    host.appendChild(this.overlay);
    this.makeStage();
    this.camera.position.set(4.2,3.1,5.3);
    this.camera.lookAt(0,0,0);
    this.controls = new OrbitControls(this.camera,this.surface);
    this.controls.target.set(0,0,0);
    this.controls.enablePan=false;
    this.controls.enableZoom=false;
    this.controls.enableDamping=true;
    this.controls.dampingFactor=.09;
    this.controls.minPolarAngle=.15;
    this.controls.maxPolarAngle=Math.PI-.15;
    this.controls.update();
    const el=this.surface;
    el.addEventListener('pointerdown',this.onPointerDown);
    el.addEventListener('pointermove',this.onPointerMove);
    el.addEventListener('pointerup',this.onPointerUp);
    el.addEventListener('pointerleave',this.onPointerLeave);
    this.observer=new ResizeObserver(()=>this.resize());
    this.observer.observe(host);
    this.resize();
    this.animate();
  }

  private material(color:number):THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({color,metalness:.03,roughness:.74,side:THREE.DoubleSide,emissive:0x000000});
  }
  private addPickable(mesh: Pickable, type: Feature, order: number, center = mesh.position): void {
    mesh.userData = { type, order, center: center.clone(), index: this.pickables.filter(m => m.userData.type === type).length };
    this.cube.add(mesh);
    this.pickables.push(mesh);
    this.baseColors.set(mesh, mesh.material.color.clone());
    if (this.focusPalette) this.paintFeature(mesh);
  }

  private makeSolid(): void {
    const { vertices, faces, edges } = solidMesh(this.solid);
    this.mirrors = mirrorNormals(vertices);
    const palette = [0x91aabd, 0xc8d3ce, 0xdab790, 0xaaa1bd, 0x86aba0];
    faces.forEach((face, i) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(face.triangles, 3));
      geometry.computeVertexNormals();
      const center = new THREE.Vector3();
      face.corners.forEach(index => center.add(vertices[index]));
      center.divideScalar(face.corners.size);
      this.addPickable(new THREE.Mesh(geometry, this.material(palette[i % palette.length])),
        'face', face.corners.size, center);
    });
    edges.forEach(([a, b], i) => {
      const direction = vertices[b].clone().sub(vertices[a]);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, direction.length(), 12),
        this.material(i === 0 ? 0x91724d : 0x444e55));
      mesh.position.copy(vertices[a]).lerp(vertices[b], .5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      this.addPickable(mesh, 'edge', 2);
    });
    vertices.forEach((point, i) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(.095, this.renderer instanceof SVGRenderer ? 8 : 16, this.renderer instanceof SVGRenderer ? 6 : 12),
        this.material([0xe37862, 0xd1a16d, 0x6c8fb1, 0x77a788][i % 4]));
      mesh.position.copy(point);
      this.addPickable(mesh, 'vertex', edges.filter(edge => edge.includes(i)).length);
    });
  }

  setSolid(solid: Solid): void {
    this.motion = null;
    this.closeDial();
    this.hovered = null;
    this.tracked = null;
    this.marks = [];
    this.visited.clear();
    for (const mesh of this.pickables) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.pickables.length = 0;
    this.cube.matrix.identity();
    this.cube.matrixWorldNeedsUpdate = true;
    this.solid = solid;
    this.makeSolid();
    this.resetView();
  }

  setMode(mode: 'rotate' | 'reflect'): void {
    this.mode = mode;
    if (this.selected && this.canTransform) this.openDial(this.selected);
    else if (!this.motion) this.onHint(`Click a face, edge, or vertex to ${mode} the solid.`);
  }

  private makeStage():void {
    const grid=new THREE.GridHelper(11,22,0xc2b9aa,0xe1d9cd);
    grid.position.y=-1.86;
    const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
    mats.forEach(mat=>{mat.transparent=true;mat.opacity=.48;});
    this.scene.add(grid);
    const marker=new THREE.Mesh(new THREE.CircleGeometry(2.4,64),new THREE.MeshBasicMaterial({color:0xece6dc,transparent:true,opacity:.58,depthWrite:false}));
    marker.rotation.x=-Math.PI/2;
    marker.position.y=-1.87;
    this.scene.add(marker);
  }

  private resize():void {
    const w=Math.max(this.host.clientWidth,250),h=Math.max(this.host.clientHeight,250);
    this.camera.aspect=w/h;
    this.camera.updateProjectionMatrix();
    this.surface.style.width = `${w}px`;
    this.surface.style.height = `${h}px`;
    this.renderer.setSize(w, h);
    if (this.selected && this.mode === 'rotate') this.positionDial(this.selected);
  }

  private readonly onPointerDown = (event:PointerEvent):void => {
    if (this.motion || (this.canTransform && this.selected && !this.mirrorChoices.length)) return;
    this.pointerDragged = false;
    this.pointerStart={x:event.clientX,y:event.clientY};
  };
  private readonly onPointerMove = (event:PointerEvent):void => {
    if (this.pointerStart &&
      Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y) > 6) {
      this.pointerDragged = true;
    }
    if (this.mirrorChoices.length) {
      this.highlightMirror(this.pointerStart && this.pointerDragged ? null : this.pickMirror(event));
      return;
    }
    if (this.canTransform && this.selected || this.motion) return;
    if (this.pointerStart && this.pointerDragged) {
      this.setHovered(null);return;
    }
    this.setHovered(this.pick(event));
  };
  private readonly onPointerLeave = ():void => {
    this.pointerStart = null;
    this.setHovered(null);
    this.highlightMirror(null);
  };
  private readonly onPointerUp = (event:PointerEvent):void => {
    if(!this.pointerStart) return;
    const travel=Math.hypot(event.clientX-this.pointerStart.x,event.clientY-this.pointerStart.y);
    const dragged = this.pointerDragged || travel > 6;
    this.pointerStart=null;
    if (this.mirrorChoices.length) {
      const choice = this.pickMirror(event);
      if (!dragged && choice !== null) this.applyMirror(choice);
      return;
    }
    if (dragged) {
      if (this.orbitEnabled) this.onOrbit();
      return;
    }
    const hit=this.pick(event);
    if(!hit) {this.onHint('Try clicking a visible face, edge, or vertex of the solid.');return;}
    this.select(hit);
  };

  private aimRay(event: PointerEvent): boolean {
    const rect=this.surface.getBoundingClientRect();
    if(!rect.width || !rect.height) return false;
    this.pointer.set(((event.clientX-rect.left)/rect.width)*2-1, -((event.clientY-rect.top)/rect.height)*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    return true;
  }

  private pick(event: PointerEvent): Pickable | null {
    if (!this.aimRay(event)) return null;
    const hit = this.raycaster.intersectObjects(this.pickables, false)[0]?.object as Pickable | undefined;
    return hit && this.allowed.has(hit.userData.type) ? hit : null;
  }

  private setHovered(next:Pickable|null):void {
    if(this.hovered===next) return;
    const previous = this.hovered;
    this.hovered = next;
    if (previous) this.paintFeature(previous);
    if (next) this.paintFeature(next);
    this.surface.style.cursor=next?'pointer':'grab';
  }

  enableInvestigation(): void { this.trackingEnabled = true; }

  setInspectionOnly(value: boolean, pickFirst = false): void {
    this.inspectionOnly = value;
    this.choosingFeature = pickFirst;
  }

  chooseTrackedFeature(): void {
    if (this.motion) return;
    this.closeDial();
    this.choosingFeature = true;
    this.onHint('Click the face, edge, or vertex you want to follow.');
  }

  setTrialPose(matrix: THREE.Matrix4): void {
    this.motion = null;
    this.closeDial();
    this.controls.enabled = this.orbitEnabled;
    this.cube.matrix.copy(matrix);
    this.cube.matrixWorldNeedsUpdate = true;
  }

  playSavedSymmetry(target: THREE.Matrix4): boolean {
    if (this.motion || !this.tracked) return false;
    const hit = this.pickables.find(mesh => mesh.userData.type === this.tracked?.type &&
      mesh.userData.index === this.tracked?.index);
    if (!hit) return false;
    const basis = new THREE.Matrix4();
    this.setTrialPose(basis);
    if (target.determinant() < 0) {
      // A reflection's normal is the direction of every nonzero column of I - M.
      const matrix = target.elements;
      const columns = [0, 1, 2].map(i => new THREE.Vector3(
        Number(i === 0) - matrix[4 * i],
        Number(i === 1) - matrix[4 * i + 1],
        Number(i === 2) - matrix[4 * i + 2]));
      columns.sort((a, b) => b.lengthSq() - a.lengthSq());
      this.transform(hit, basis, columns[0].normalize(), null);
    } else {
      const q = new THREE.Quaternion().setFromRotationMatrix(target).normalize();
      if (q.w < 0) q.set(-q.x, -q.y, -q.z, -q.w);
      const axis = new THREE.Vector3(q.x, q.y, q.z);
      if (axis.lengthSq() < 1e-12) return false;
      const angle = 2 * Math.atan2(axis.length(), q.w);
      this.transform(hit, basis, axis.normalize(), angle);
    }
    return true;
  }

  showTracking(tracked: { type: Feature; index: number } | null, visited: Iterable<number>): void {
    this.tracked = tracked;
    this.visited = new Set(visited);
    this.pickables.forEach(mesh => this.paintFeature(mesh));
  }

  setInvestigationMarks(marks: {type: Feature; index: number; color: number}[], focusPalette = false): void {
    this.marks = marks;
    this.focusPalette = focusPalette;
    this.pickables.forEach(mesh => this.paintFeature(mesh));
  }

  setPositionLabels(labels: {point: THREE.Vector3; text: string; color: string}[]): void {
    for (const label of this.positionLabels) label.element.remove();
    this.positionLabels = labels.map(({point,text,color}) => {
      const element = document.createElement('span');
      element.className = 'solid-position-label';
      element.textContent = text;
      element.style.borderColor = color;
      element.setAttribute('aria-hidden','true');
      this.host.append(element);
      return {point,element};
    });
  }

  private placePositionLabels(): void {
    const width = this.host.clientWidth, height = this.host.clientHeight;
    for (const {point,element} of this.positionLabels) {
      const p = point.clone().project(this.camera);
      element.style.left = ((p.x+1)*width/2) + 'px';
      element.style.top = ((1-p.y)*height/2) + 'px';
    }
  }

  private paintFeature(mesh: Pickable): void {
    const { type, index } = mesh.userData;
    const tracked = type === this.tracked?.type;
    const mark = this.marks.find(m => m.type === type && m.index === index);
    if (this.focusPalette) {
      mesh.material.color.setHex(mark?.color ?? (type === 'face' ? 0x8e949c : 0x555d66));
      mesh.material.emissive.setHex(mark ? 0x443600 : 0);
      return;
    }
    mesh.material.color.copy(this.baseColors.get(mesh)!);
    mesh.material.emissive.setHex(mark ? mark.color : mesh === this.selected ? COLORS[type as Feature]
      : tracked && index === this.tracked?.index ? 0x138f77
      : mesh === this.hovered ? 0x4d3b12 : tracked && this.visited.has(index) ? 0x395e50 : 0);
  }

  selectFeatureByType(type: Feature, tracking: boolean): void {
    if (this.motion) return;
    this.choosingFeature = tracking;
    const mesh = this.pickables.find(candidate => candidate.userData.type === type);
    if (mesh) this.select(mesh);
    this.mirrorChoices[0]?.button.focus({ preventScroll: true });
  }

  private select(hit:Pickable):void {
    if (this.motion || !this.allowed.has(hit.userData.type)) return;
    if (this.choosingFeature) {
      this.choosingFeature = false;
      this.onTrack(hit.userData.type as Feature, hit.userData.index as number);
      return;
    }
    if (this.inspectionOnly) return;
    this.closeDial();
    this.selected = hit;
    this.paintFeature(hit);
    if (this.canTransform) this.openDial(hit);
    this.onPick(hit.userData.type as Feature);
    if (!this.canTransform) this.onHint(`Selected ${hit.userData.type as Feature}.`);
  }

  private positionDial(hit: Pickable): void {
    this.cube.updateMatrixWorld(true);
    this.camera.updateMatrixWorld();
    const center = (hit.userData.center as THREE.Vector3).clone().applyMatrix4(this.cube.matrixWorld).project(this.camera);
    const clamp = (v: number, size: number, margin: number) => Math.max(margin, Math.min(size - margin, v));
    const w = this.host.clientWidth, h = this.host.clientHeight;
    this.overlay.style.left = `${clamp((center.x + 1) * w / 2, w, 78)}px`;
    this.overlay.style.top = `${clamp((1 - center.y) * h / 2, h, 105)}px`;
  }

  private closeDial(): void {
    const previous = this.selected;
    this.selected = null;
    if (previous) this.paintFeature(previous);
    this.overlay.hidden = true;
    this.clearMirrorChoices();
    this.controls.enabled = this.orbitEnabled && !this.motion;
  }

  private openDial(hit: Pickable): void {
    this.clearMirrorChoices();
    if (this.mode === 'reflect') {
      this.openMirrorChoices(hit);
      return;
    }
    this.controls.enabled = false;
    this.overlay.classList.remove('mirror-picker');
    this.positionDial(hit);
    const localAxis = (hit.userData.center as THREE.Vector3).clone().normalize();
    const basis = this.cube.matrix.clone();
    const axis = localAxis.clone().transformDirection(basis);
    // Orient positive turns toward the viewer, including when using the keyboard picker.
    if (axis.dot(this.camera.position) < 0) axis.negate();
    const order = hit.userData.order as number;
    this.overlay.hidden = false;
    this.overlay.innerHTML = `<button type="button" class="dial-close" aria-label="Cancel transformation">×</button>
      <canvas width="128" height="128" tabindex="0" aria-label="Rotation dial. Use arrow keys, then Enter to apply."></canvas>
      <output></output>`;
    this.overlay.querySelector('button')!.onclick = () => this.closeDial();
    const canvas = this.overlay.querySelector('canvas')!;
    const label = this.overlay.querySelector('output')!;
    const ctx = canvas.getContext('2d')!;
    let steps = 0, previous = 0, travel = 0;
    const step = 2 * Math.PI / order;
    const draw = () => {
      ctx.clearRect(0, 0, 128, 128);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#55766c';
      for (let i = 0; i < order; i++) {
        ctx.beginPath(); ctx.moveTo(64, 64);
        ctx.arc(64, 64, 59, -(i + .5) * step, -(i - .5) * step);
        ctx.closePath();
        ctx.fillStyle = i === ((steps % order) + order) % order ? '#aed2beef' : '#fffdf4e8';
        ctx.fill(); ctx.stroke();
      }
      label.textContent = `${steps > 0 ? '+' : ''}${steps * 360 / order}°`;
    };
    const apply = () => {
      if (steps !== 0) this.transform(hit, basis, axis, steps * step);
    };
    const pointerAngle = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const x = event.clientX - box.left - box.width / 2;
      const y = box.height / 2 - (event.clientY - box.top);
      return Math.hypot(x, y) >= 8 ? Math.atan2(y, x) : null;
    };
    const update = (event: PointerEvent) => {
      const angle = pointerAngle(event);
      if (angle === null) return;
      const change = angle - previous;
      travel += Math.atan2(Math.sin(change), Math.cos(change));
      previous = angle;
      steps = Math.sign(travel) * Math.round(Math.abs(travel) / step);
      draw();
    };
    canvas.onpointerdown = event => {
      if (event.button !== 0) return;
      canvas.setPointerCapture(event.pointerId);
      previous = pointerAngle(event) ?? 0; travel = 0; steps = 0;
      update(event);
    };
    canvas.onpointermove = event => { if (canvas.hasPointerCapture(event.pointerId)) update(event); };
    canvas.onpointerup = event => {
      if (!canvas.hasPointerCapture(event.pointerId)) return;
      update(event);
      apply();
    };
    canvas.onpointercancel = () => { steps = 0; draw(); };
    this.overlay.onkeydown = event => {
      if (event.key === 'Escape') this.closeDial();
      if (event.target !== canvas) return;
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); apply(); }
      const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0;
      if (direction) {
        event.preventDefault();
        steps += direction;
        draw();
      }
    };
    draw();
    canvas.focus({ preventScroll: true });
    this.onHint(`Drag in ${360 / order}° steps and release.`);
  }

  private openMirrorChoices(hit: Pickable): void {
    this.controls.enabled = this.orbitEnabled;
    const localAxis = (hit.userData.center as THREE.Vector3).clone().normalize();
    const normals = this.mirrors.filter(n => Math.abs(n.dot(localAxis)) < 1e-6)
      .map(n => n.clone().transformDirection(this.cube.matrix));
    const colors = [0x387fa2, 0xbc6a39, 0x557e49, 0x845caa, 0xa14768];
    this.overlay.classList.add('mirror-picker');
    this.overlay.hidden = false;
    this.overlay.innerHTML = '<span>Mirror planes</span><button type="button" class="mirror-cancel">Cancel</button>';
    this.overlay.querySelector('button')!.onclick = () => this.closeDial();
    this.overlay.onkeydown = event => { if (event.key === 'Escape') this.closeDial(); };
    normals.forEach((normal, index) => {
      const color = colors[index % colors.length];
      const radius = 2.15;
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), new THREE.MeshBasicMaterial({
        color, side: THREE.DoubleSide, transparent: true, opacity: .23, depthWrite: false,
      }));
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      const ring = Array.from({ length: 64 }, (_, i) => {
        const angle = i * 2 * Math.PI / 64;
        return new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0);
      });
      const rim = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ring),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: .8, depthWrite: false }));
      mesh.add(rim);
      this.scene.add(mesh);
      mesh.updateMatrixWorld(true);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(index + 1);
      button.style.setProperty('--mirror-color', `#${new THREE.Color(color).getHexString()}`);
      button.setAttribute('aria-label', `Reflect across plane ${index + 1}`);
      button.onpointerenter = button.onfocus = () => this.highlightMirror(index);
      button.onpointerleave = button.onblur = () => this.highlightMirror(null);
      button.onclick = () => this.applyMirror(index);
      this.overlay.appendChild(button);
      this.mirrorChoices.push({ mesh, normal, rim, button });
    });
    this.highlightMirror(null);
    this.onHint('Drag to orbit or click a colored plane to reflect.');
  }

  private pickMirror(event: PointerEvent): number | null {
    if (!this.aimRay(event)) return null;
    const planes = this.raycaster.intersectObjects(this.mirrorChoices.map(choice => choice.mesh), false);
    const solid = this.raycaster.intersectObjects(this.pickables, false)[0];
    const visible = planes.find(plane => !solid || plane.distance < solid.distance);
    return visible ? this.mirrorChoices.findIndex(choice => choice.mesh === visible.object) : null;
  }

  private highlightMirror(index: number | null): void {
    if (!this.mirrorChoices.length || index === this.mirrorPreview) return;
    this.mirrorPreview = index;
    this.mirrorChoices.forEach(({ mesh, rim, button }, i) => {
      const active = i === index;
      mesh.material.opacity = active ? .48 : .23;
      mesh.renderOrder = active ? 1 : 0;
      rim.material.opacity = active ? 1 : .8;
      button.classList.toggle('preview', active);
    });
    this.surface.style.cursor = index === null ? 'default' : 'pointer';
  }

  private applyMirror(index: number): void {
    const choice = this.mirrorChoices[index];
    if (choice && this.selected) this.transform(this.selected, this.cube.matrix.clone(), choice.normal, null);
  }

  private clearMirrorChoices(): void {
    for (const { mesh, rim } of this.mirrorChoices) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
      rim.geometry.dispose();
      rim.material.dispose();
    }
    this.mirrorChoices.length = 0;
    this.mirrorPreview = null;
    this.surface.style.cursor = 'grab';
  }

  private transform(hit: Pickable, basis: THREE.Matrix4, axis: THREE.Vector3, angle: number | null): void {
    const type = hit.userData.type as Feature;
    const start = performance.now();
    const matrix = new THREE.Matrix4();
    if (this.onMoveStart) {
      const delta = angle === null ? reflectionMatrix(axis) : new THREE.Matrix4().makeRotationAxis(axis,angle);
      this.onMoveStart(basis.clone(),delta.multiply(basis));
    }
    this.motion = now => {
      const time = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : Math.min(1, (now - start) / 680);
      const progress = time * time * (3 - 2 * time);
      if (angle === null) matrix.copy(reflectionMatrix(axis, progress));
      else matrix.makeRotationAxis(axis, angle * progress);
      this.cube.matrix.multiplyMatrices(matrix, basis);
      this.cube.matrixWorldNeedsUpdate = true;
      this.onMoveProgress?.(progress);
      if (time < 1) return;
      this.motion = null;
      this.controls.enabled = this.orbitEnabled;
      this.performed.add(type);
      this.currentTask = (['face', 'edge', 'vertex'] as const).find(f => !this.performed.has(f)) ?? 'vertex';
      this.onSelected(type);
      this.onSymmetry(angle === null ? 'reflect' : 'rotate');
      if (this.trackingEnabled) this.onTransform(this.cube.matrix.clone());
      else this.onHint(`Symmetry applied through the ${type}. Watch how the colored features changed places.`);
    };
    this.closeDial();
    this.controls.enabled = this.orbitEnabled && angle === null;
  }

  /** Alternative to raycasting for users navigating with a keyboard or assistive technology. */
  selectKeyboardFeature():void {
    const mesh=this.pickables.find(m=>m.userData.type===this.currentTask && m!==this.selected);
    if (mesh) {
      this.select(mesh);
      this.mirrorChoices[0]?.button.focus({ preventScroll: true });
    }
  }
  currentFeature():Feature {return this.currentTask;}
  resetView():void {
    if (this.motion) return;
    this.closeDial();
    this.camera.position.set(4.2,3.1,5.3);
    this.controls.target.set(0,0,0);
    this.controls.update();
    this.onHint('View reset. Drag to orbit, or click a face, edge, or vertex.');
  }

  private animate = ():void => {
    this.frame=requestAnimationFrame(this.animate);
    if (this.controls.enabled) this.controls.update();
    this.motion?.(performance.now());
    this.renderer.render(this.scene,this.camera);
    if (this.positionLabels.length) this.placePositionLabels();
  };

  destroy():void {
    this.setPositionLabels([]);
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    const el=this.surface;
    el.removeEventListener('pointerdown',this.onPointerDown);
    el.removeEventListener('pointermove',this.onPointerMove);
    el.removeEventListener('pointerup',this.onPointerUp);
    el.removeEventListener('pointerleave',this.onPointerLeave);
    this.clearMirrorChoices();
    this.controls.dispose();
    this.scene.traverse(object=>{
      if(object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        const mats=Array.isArray(object.material)?object.material:[object.material];
        mats.forEach(mat=>mat.dispose());
      }
    });
    this.renderer.domElement.remove();
    this.overlay.remove();
    el.remove();
  }
}

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Settings, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Desktop3DProps {
  onCustomize?: () => void;
  theme?: "space" | "ocean" | "forest" | "neon" | "abstract";
}

export const Desktop3D: React.FC<Desktop3DProps> = ({
  onCustomize,
  theme = "space",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const objectsRef = useRef<THREE.Object3D[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 100, 1000);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    scene.add(directionalLight);

    // Create theme-specific environment
    createEnvironment(scene, theme);

    // Create interactive objects
    const objects = createInteractiveObjects(scene, theme);
    objectsRef.current = objects;

    sceneRef.current = scene;
    rendererRef.current = renderer;

    setIsLoading(false);

    // Mouse interaction
    let mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    containerRef.current.addEventListener("mousemove", onMouseMove);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotate and animate objects
      objects.forEach((obj, index) => {
        if (obj instanceof THREE.Mesh) {
          obj.rotation.x += 0.001 * (index + 1);
          obj.rotation.y += 0.002 * (index + 1);

          // Follow mouse
          obj.position.x += (mouse.x * 20 - obj.position.x) * 0.05;
          obj.position.y += (mouse.y * 20 - obj.position.y) * 0.05;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      containerRef.current?.removeEventListener("mousemove", onMouseMove);
      containerRef.current?.removeChild(renderer.domElement);
      animationFrameId && cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden shadow-2xl"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-purple-500 border-t-pink-500 rounded-full"
          />
        </div>
      )}

      {/* Customization Button */}
      {onCustomize && (
        <button
          onClick={onCustomize}
          className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all z-10"
          title="Customize 3D Environment"
        >
          <Settings size={20} className="text-white" />
        </button>
      )}

      {/* Theme Indicator */}
      <div className="absolute top-4 left-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-semibold capitalize z-10">
        Theme: {theme}
      </div>
    </div>
  );
};

function createEnvironment(scene: THREE.Scene, theme: string) {
  switch (theme) {
    case "space":
      createSpaceEnvironment(scene);
      break;
    case "ocean":
      createOceanEnvironment(scene);
      break;
    case "forest":
      createForestEnvironment(scene);
      break;
    case "neon":
      createNeonEnvironment(scene);
      break;
    case "abstract":
      createAbstractEnvironment(scene);
      break;
  }
}

function createSpaceEnvironment(scene: THREE.Scene) {
  // Create stars
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 1000;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 400;
    positions[i + 1] = (Math.random() - 0.5) * 400;
    positions[i + 2] = (Math.random() - 0.5) * 400;
  }

  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: true,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Add nebula effect
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 180);
    gradient.addColorStop(0, "rgba(138, 43, 226, 0.5)");
    gradient.addColorStop(0.5, "rgba(75, 0, 130, 0.3)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const nebulaGeometry = new THREE.SphereGeometry(150, 32, 32);
  const nebulaMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
  scene.add(nebula);
}

function createOceanEnvironment(scene: THREE.Scene) {
  // Create water-like background
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, "#001a4d");
    gradient.addColorStop(0.5, "#003d99");
    gradient.addColorStop(1, "#0066cc");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const bgGeometry = new THREE.BoxGeometry(400, 400, 400);
  const bgMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
  });
  const bg = new THREE.Mesh(bgGeometry, bgMaterial);
  scene.add(bg);

  // Add water particles
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 500;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 200;
    positions[i + 1] = (Math.random() - 0.5) * 200;
    positions[i + 2] = (Math.random() - 0.5) * 200;
  }

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.5,
    transparent: true,
    opacity: 0.6,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
}

function createForestEnvironment(scene: THREE.Scene) {
  // Green gradient background
  scene.background = new THREE.Color(0x1a3a1a);
  scene.fog = new THREE.Fog(0x1a3a1a, 100, 500);

  // Create trees using simple geometries
  for (let i = 0; i < 5; i++) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 3, 20, 8),
      new THREE.MeshStandardMaterial({ color: 0x5d4037 })
    );
    trunk.position.set((i - 2) * 15, -10, -50 + i * 10);
    scene.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(8, 30, 8),
      new THREE.MeshStandardMaterial({ color: 0x2d5016 })
    );
    foliage.position.set((i - 2) * 15, 5, -50 + i * 10);
    scene.add(foliage);
  }
}

function createNeonEnvironment(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x0d0221);

  // Add neon grid
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#0d0221";
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;

    for (let i = 0; i < 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  const planeGeometry = new THREE.PlaneGeometry(200, 200);
  const planeMaterial = new THREE.MeshBasicMaterial({ map: texture });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.z = -50;
  scene.add(plane);
}

function createAbstractEnvironment(scene: THREE.Scene) {
  // Random colorful shapes
  const colors = [0xff006e, 0xfb5607, 0xffbe0b, 0x8338ec, 0x3a86ff];

  for (let i = 0; i < 5; i++) {
    const geometries = [
      new THREE.IcosahedronGeometry(5, 4),
      new THREE.OctahedronGeometry(5),
      new THREE.TorusGeometry(5, 2, 16, 100),
    ];

    const geometry = geometries[i % geometries.length];
    const material = new THREE.MeshPhongMaterial({
      color: colors[i % colors.length],
      emissive: colors[i % colors.length],
      emissiveIntensity: 0.5,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (i - 2) * 20,
      (Math.random() - 0.5) * 30,
      -30 - i * 5
    );
    scene.add(mesh);
  }
}

function createInteractiveObjects(scene: THREE.Scene, theme: string): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];
  const colors =
    theme === "neon"
      ? [0x00ff88, 0xff006e, 0xfb5607, 0x3a86ff, 0x8338ec]
      : theme === "ocean"
        ? [0x00d9ff, 0x0099ff, 0x003d99, 0x66ccff, 0x0066cc]
        : [0xff006e, 0xfb5607, 0xffbe0b, 0x8338ec, 0x3a86ff];

  // Create rotating objects
  for (let i = 0; i < 5; i++) {
    const geometries = [
      new THREE.BoxGeometry(3, 3, 3),
      new THREE.SphereGeometry(2, 32, 32),
      new THREE.OctahedronGeometry(2),
      new THREE.TorusGeometry(2, 0.8, 16, 100),
      new THREE.IcosahedronGeometry(2, 4),
    ];

    const geometry = geometries[i];
    const material = new THREE.MeshPhongMaterial({
      color: colors[i],
      emissive: colors[i],
      emissiveIntensity: 0.3,
      shininess: 100,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (i - 2) * 12,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    objects.push(mesh);
    scene.add(mesh);
  }

  return objects;
}

export default Desktop3D;

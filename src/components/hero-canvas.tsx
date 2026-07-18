"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const goldLight = new THREE.DirectionalLight(0xfef08a, 2.5); // Key Gold Light
    goldLight.position.set(5, 5, 3);
    scene.add(goldLight);

    const mintLight = new THREE.DirectionalLight(0xa7f3d0, 1.8); // Fill Mint Light
    mintLight.position.set(-5, -3, 2);
    scene.add(mintLight);

    // Core Specimen Group
    const specimen = new THREE.Group();
    scene.add(specimen);

    // Outer Glass Bubble
    const glassGeom = new THREE.SphereGeometry(1.0, 32, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.95,
      thickness: 0.6,
      side: THREE.DoubleSide,
    });
    const glassMesh = new THREE.Mesh(glassGeom, glassMat);
    specimen.add(glassMesh);

    // Inner detailed Apple
    const appleGroup = new THREE.Group();
    
    const appleBodyGeom = new THREE.SphereGeometry(0.55, 24, 24);
    // Indent top of apple
    const pos = appleBodyGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0.35) {
        pos.setY(i, y - 0.06);
      }
    }
    appleBodyGeom.computeVertexNormals();

    const appleBodyMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Bright red
      roughness: 0.25,
      metalness: 0.1,
    });
    const appleBody = new THREE.Mesh(appleBodyGeom, appleBodyMat);
    appleGroup.add(appleBody);

    const stemGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const stem = new THREE.Mesh(stemGeom, stemMat);
    stem.position.y = 0.55;
    stem.rotation.z = 0.2;
    appleGroup.add(stem);

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.1, 0.15, 0, 0.3);
    leafShape.quadraticCurveTo(-0.1, 0.15, 0, 0);
    const leafGeom = new THREE.ExtrudeGeometry(leafShape, { depth: 0.008, bevelEnabled: false });
    leafGeom.center();
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const appleLeaf = new THREE.Mesh(leafGeom, leafMat);
    appleLeaf.position.set(0.1, 0.62, 0.03);
    appleLeaf.rotation.set(0.1, -0.3, 0.4);
    appleGroup.add(appleLeaf);

    specimen.add(appleGroup);

    // Mouse movement sways listener
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Coordinates normalized to -1 to 1 relative to container
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current = { x, y };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Gentle spinning of glass bubble
      glassMesh.rotation.y += 0.002;

      // Spin apple slightly faster
      appleGroup.rotation.y += 0.006;
      appleGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.05;

      // Mouse coordinate sway interpolation
      const targetRotX = mouseRef.current.y * 0.3;
      const targetRotY = mouseRef.current.x * 0.3;

      specimen.rotation.x = THREE.MathUtils.lerp(specimen.rotation.x, targetRotX, 0.07);
      specimen.rotation.y = THREE.MathUtils.lerp(specimen.rotation.y, targetRotY, 0.07);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

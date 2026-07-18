"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatCurrency } from "@/lib/pricing";

// Register GSAP ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Product = {
  id: string;
  name: string;
  priceCents: number;
  unit: string;
  stock: number;
  description: string;
  images: Array<{ url: string; alt: string }>;
  category?: { name: string } | null;
};

type Props = {
  products: Product[];
};

export function ProductThreeCanvas({ products }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Slice first 5 products for 3D showcase
  const showcaseProducts = useMemo(() => products.slice(0, 5), [products]);

  // Track mouse coordinates for interactive gravity tilt
  const mouseRef = useRef({ x: 0, y: 0 });

  const handleAddToCart = async (product: Product) => {
    setAddingId(product.id);
    setMessage(null);

    try {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const me: { user: { id: string } | null } = await meRes.json();

      if (me.user) {
        const result = await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        if (!result.ok) {
          setMessage("Could not add item.");
          setAddingId(null);
          return;
        }
      } else {
        const raw = localStorage.getItem("freshlane_guest_cart");
        const cart = raw ? JSON.parse(raw) : {};
        cart[product.id] = (cart[product.id] ?? 0) + 1;
        localStorage.setItem("freshlane_guest_cart", JSON.stringify(cart));
      }

      window.dispatchEvent(new Event("cart-updated"));
      setMessage("Added to cart!");
      setTimeout(() => {
        setAddingId(null);
        setMessage(null);
      }, 1500);
    } catch (e) {
      setMessage("Failed to add to cart.");
      setAddingId(null);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const stickyContainer = canvasRef.current.parentElement;
    if (!stickyContainer) return;

    const width = stickyContainer.clientWidth;
    const height = stickyContainer.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Dual Studio Lighting System (Warm Gold + Cool Mint)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // Warm Key Light (Gold)
    const goldLight = new THREE.DirectionalLight(0xfef08a, 2.5);
    goldLight.position.set(6, 10, 4);
    goldLight.castShadow = true;
    goldLight.shadow.mapSize.width = 1024;
    goldLight.shadow.mapSize.height = 1024;
    scene.add(goldLight);

    // Cool Fill Light (Mint)
    const mintLight = new THREE.DirectionalLight(0xa7f3d0, 1.8);
    mintLight.position.set(-6, -5, 3);
    scene.add(mintLight);

    // Accent Point Light (Green glow)
    const pointLight = new THREE.PointLight(0x4caf50, 3, 10);
    pointLight.position.set(0, -1.5, 2.5);
    scene.add(pointLight);

    // 3. Canvas Texture Generator (Fallback)
    const createFallbackTexture = (name: string, categoryName: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(canvas);

      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, "#0d3b13");
      gradient.addColorStop(1, "#1b5e20");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = "rgba(217, 119, 6, 0.3)";
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, 492, 492);

      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.roundRect ? ctx.roundRect(140, 50, 232, 40, 20) : ctx.rect(140, 50, 232, 40);
      ctx.fill();

      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#fef08a"; // Gold
      ctx.textAlign = "center";
      ctx.fillText((categoryName || "Fresh Choice").toUpperCase(), 256, 75);

      ctx.font = "bold 34px sans-serif";
      ctx.fillStyle = "#ffffff";
      
      const words = name.split(" ");
      let line = "";
      let y = 240;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        if (ctx.measureText(testLine).width > 420 && n > 0) {
          ctx.fillText(line, 256, y);
          line = words[n] + " ";
          y += 48;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 256, y);

      ctx.font = "italic 16px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText("FreshLane Organics", 256, 460);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      return texture;
    };

    // 4. Create Framed 3D Cards
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const cards: THREE.Group[] = [];
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    showcaseProducts.forEach((product, index) => {
      const imageUrl = product.images[0]?.url;
      const categoryName = product.category?.name || "Organic";
      
      const singleCardGroup = new THREE.Group();

      let frontMaterial: THREE.Material;

      if (imageUrl) {
        const texture = textureLoader.load(
          imageUrl,
          (tex) => {
            tex.minFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;
          },
          undefined,
          () => {
            const fallbackTex = createFallbackTexture(product.name, categoryName);
            (cardMesh.material as THREE.Material[])[4] = new THREE.MeshBasicMaterial({ map: fallbackTex });
          }
        );

        frontMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.FrontSide,
        });
      } else {
        const fallbackTex = createFallbackTexture(product.name, categoryName);
        frontMaterial = new THREE.MeshBasicMaterial({ map: fallbackTex });
      }

      // Back plate material (Deep Forest Green)
      const backMaterial = new THREE.MeshStandardMaterial({
        color: 0x0d3b13,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.BackSide,
      });

      // Side material
      const sideMaterial = new THREE.MeshStandardMaterial({
        color: 0x111827, // Dark slate
        roughness: 0.6,
      });

      // Geometry for the image plate
      const plateGeometry = new THREE.BoxGeometry(2.2, 3.0, 0.04);
      const materials = [
        sideMaterial, // right
        sideMaterial, // left
        sideMaterial, // top
        sideMaterial, // bottom
        frontMaterial, // front
        backMaterial,  // back
      ];

      const cardMesh = new THREE.Mesh(plateGeometry, materials);
      cardMesh.castShadow = true;
      cardMesh.receiveShadow = true;
      singleCardGroup.add(cardMesh);

      // Gold Bezel Frame Overlay (3D Frame look)
      const frameGeometry = new THREE.BoxGeometry(2.32, 3.12, 0.06);
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0xd97706, // Gold bezel
        roughness: 0.22,
        metalness: 0.85, // Highly metallic
      });
      const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
      frameMesh.position.z = -0.02; // Positioned behind the front image plate
      singleCardGroup.add(frameMesh);

      // Card initial positioning
      singleCardGroup.position.set(index * 3.5, -index * 2, -index * 3);
      singleCardGroup.rotation.set(0, -0.2, 0);

      cardGroup.add(singleCardGroup);
      cards.push(singleCardGroup);
    });

    // 5. Create Glassmorphic Floating Grocery Gems (Spline-like bubble particles)
    const floatersGroup = new THREE.Group();
    scene.add(floatersGroup);

    const floaters: { group: THREE.Group; seed: number; speedX: number; speedY: number; rotSpeed: number }[] = [];

    // Helper: Create internal Apple mesh
    const createAppleMesh = () => {
      const apple = new THREE.Group();
      const bodyGeom = new THREE.SphereGeometry(0.16, 16, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      apple.add(body);

      const stemGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.y = 0.18;
      stem.rotation.z = 0.15;
      apple.add(stem);

      return apple;
    };

    // Helper: Create internal Orange mesh
    const createOrangeMesh = () => {
      const bodyGeom = new THREE.SphereGeometry(0.17, 16, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
      return new THREE.Mesh(bodyGeom, bodyMat);
    };

    // Helper: Create internal Leaf mesh
    const createLeafMesh = () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.08, 0.12, 0, 0.24);
      shape.quadraticCurveTo(-0.08, 0.12, 0, 0);
      
      const extrudeSettings = { depth: 0.005, bevelEnabled: false };
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.center();
      const mat = new THREE.MeshStandardMaterial({ color: 0x10b981, side: THREE.DoubleSide });
      return new THREE.Mesh(geom, mat);
    };

    // Create 18 bubble capsules
    for (let i = 0; i < 18; i++) {
      const capsule = new THREE.Group();

      // Outer glass bubble sphere
      const bubbleGeom = new THREE.SphereGeometry(0.32, 24, 24);
      const bubbleMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.9, // High refraction
        thickness: 0.4,    // Physical glass thickness
        side: THREE.DoubleSide,
      });
      const bubbleMesh = new THREE.Mesh(bubbleGeom, bubbleMat);
      capsule.add(bubbleMesh);

      // Inner fruit mesh
      let fruitMesh;
      const type = i % 3;
      if (type === 0) fruitMesh = createAppleMesh();
      else if (type === 1) fruitMesh = createOrangeMesh();
      else fruitMesh = createLeafMesh();
      capsule.add(fruitMesh);

      capsule.position.set(
        (Math.random() - 0.5) * 11,
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 6
      );

      floatersGroup.add(capsule);
      floaters.push({
        group: capsule,
        seed: Math.random() * 100,
        speedX: (Math.random() - 0.5) * 0.003,
        speedY: (Math.random() - 0.5) * 0.003,
        rotSpeed: 0.006 + Math.random() * 0.006,
      });
    }

    // 6. GSAP Scroll Animation Timeline
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.3,
        onUpdate: (self) => {
          const index = Math.min(
            Math.floor(self.progress * showcaseProducts.length),
            showcaseProducts.length - 1
          );
          setActiveProductIndex(index);
        },
      },
    });

    // Move and rotate cards on scroll
    cards.forEach((card, index) => {
      const startX = index === 0 ? 0 : 5.8;
      const startY = index === 0 ? 0 : -3.8;
      const startZ = index === 0 ? 0.6 : -6;
      const startRotY = index === 0 ? 0 : -1.3;

      card.position.set(startX, startY, startZ);
      card.rotation.set(0, startRotY, 0);

      if (index > 0) {
        const prevTime = index - 1;
        
        // Slide out previous card to left
        scrollTl.to(cards[index - 1].position, {
          x: -5.8,
          y: 2.4,
          z: -5,
          duration: 1,
        }, prevTime);

        scrollTl.to(cards[index - 1].rotation, {
          y: 1.3,
          duration: 1,
        }, prevTime);

        // Slide in current card to center stage
        scrollTl.to(card.position, {
          x: 0,
          y: 0,
          z: 0.6,
          duration: 1,
        }, prevTime);

        scrollTl.to(card.rotation, {
          y: 0,
          duration: 1,
        }, prevTime);
      }
    });

    // Translate floaters over scroll progress
    floaters.forEach((floater, i) => {
      scrollTl.to(floater.group.position, {
        y: floater.group.position.y + (i % 2 === 0 ? 3.8 : -3.8),
        z: floater.group.position.z + 3,
        duration: showcaseProducts.length,
      }, 0);
    });

    ScrollTrigger.refresh();

    // 7. Mouse Movement Handler for Interactive Gravity Vortex
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current = { x, y };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 8. Animation & Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Vortex gravitational drift on bubble floaters
      floaters.forEach((floater, index) => {
        // Natural floating movement
        floater.group.position.x += Math.sin(elapsedTime + floater.seed) * floater.speedX;
        floater.group.position.y += Math.cos(elapsedTime + floater.seed) * floater.speedY;
        
        // Gentle rotation of inner fruits inside their bubbles
        const innerFruit = floater.group.children[1];
        if (innerFruit) {
          innerFruit.rotation.x += floater.rotSpeed;
          innerFruit.rotation.y += floater.rotSpeed * 0.8;
        }

        // Slow hover rotation on glass shell
        floater.group.children[0].rotation.y += 0.002;

        // Gravity pull: pull floating capsules slightly towards the mouse center pointer coordinates
        floater.group.position.x += (mouseRef.current.x * 0.15 - floater.group.position.x) * 0.002;
        floater.group.position.y += (mouseRef.current.y * 0.15 - floater.group.position.y) * 0.002;
      });

      // Render interactive mouse tilt on the active card
      cards.forEach((card, index) => {
        if (index === activeProductIndex) {
          const targetRotX = mouseRef.current.y * 0.24;
          const targetRotY = mouseRef.current.x * 0.24;
          const targetY = Math.sin(elapsedTime * 1.6) * 0.09;

          // Smooth lerp transformations
          card.position.y = THREE.MathUtils.lerp(card.position.y, targetY, 0.07);
          card.rotation.x = THREE.MathUtils.lerp(card.rotation.x, targetRotX, 0.07);
          card.rotation.y = THREE.MathUtils.lerp(card.rotation.y, targetRotY, 0.07);
        } else {
          // Reset inactive card rotations to baseline
          card.rotation.x = THREE.MathUtils.lerp(card.rotation.x, 0, 0.15);
        }
      });

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!canvasRef.current || !stickyContainer) return;
      const w = stickyContainer.clientWidth;
      const h = stickyContainer.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Clean up on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
      scene.clear();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === containerRef.current) {
          trigger.kill();
        }
      });
    };
  }, [showcaseProducts, activeProductIndex]);

  const activeProduct = showcaseProducts[activeProductIndex];

  return (
    <div ref={containerRef} className="relative w-full h-[320vh] bg-[#FAFAF5]">
      {/* Sticky Full-Viewport Canvas Container */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center">
        
        {/* ThreeJS WebGL Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />

        {/* 3D Product Details Overlay (HTML Layer) */}
        <div className="absolute inset-0 max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center justify-between z-10 pointer-events-none">
          
          {/* Left panel: Glassmorphic Details Card */}
          <div className="max-w-md w-full pointer-events-auto bg-white/35 backdrop-blur-2xl border border-slate-200/50 p-6 md:p-8 rounded-[2rem] shadow-xl flex flex-col justify-between transition-all duration-300">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#1B5E20] bg-green-50/80 px-3.5 py-1.5 rounded-full border border-green-200/40">
                Fresh Showcase
              </span>
              
              <h2 className="text-3xl font-black text-slate-950 mt-5 leading-tight tracking-tight">
                {activeProduct?.name}
              </h2>
              
              <p className="text-xs font-bold text-slate-500 mt-3.5 leading-relaxed">
                {activeProduct?.description}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#1B5E20]">
                  {activeProduct ? formatCurrency(activeProduct.priceCents) : "$0.00"}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  per {activeProduct?.unit.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {message && (
                <div className="px-3.5 py-2.5 rounded-xl bg-green-50/90 border border-green-200 text-green-700 text-xs font-bold animate-fade-in text-center leading-none shadow-sm">
                  {message}
                </div>
              )}
              
              <button
                onClick={() => handleAddToCart(activeProduct)}
                disabled={addingId === activeProduct?.id}
                className="w-full py-3.5 bg-[#1B5E20] hover:bg-[#134416] text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-[background-color,box-shadow] duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B5E20]"
              >
                {addingId === activeProduct?.id ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding…
                  </>
                ) : (
                  "Add to Cart"
                )}
              </button>
            </div>
          </div>

          {/* Right panel: Active product navigation list */}
          <div className="hidden md:flex flex-col items-end gap-3.5 text-right">
            <span className="text-xs font-black uppercase tracking-widest text-[#1B5E20] bg-[#1B5E20]/5 border border-[#1B5E20]/10 px-3.5 py-1.5 rounded-full select-none">
              Scroll to explore
            </span>
            <div className="flex flex-col items-end gap-2 mt-2">
              {showcaseProducts.map((p, idx) => {
                const isActive = activeProductIndex === idx;
                return (
                  <div key={p.id} className="flex items-center gap-2 transition-all duration-300">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? "text-[#1B5E20]" : "text-slate-400"}`}>
                      {p.name}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full transition-[background-color,transform] duration-300 ${isActive ? "bg-[#1B5E20] scale-150 shadow-[0_0_8px_rgba(27,94,32,0.4)]" : "bg-slate-300"}`} />
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

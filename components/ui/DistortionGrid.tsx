"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
}

interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
  strength: number;
}

export default function DistortionGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);
  const lastTrailSampleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile =
      "ontouchstart" in window ||
      window.matchMedia("(max-width: 768px)").matches ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configuration
    const GRID_SPACING = 50;
    const MOUSE_RADIUS = 160;
    const REPULSION_STRENGTH = 0.05;
    const SPRING_STIFFNESS = 0.02;
    const DAMPING = 0.92;
    const TRAIL_LIFETIME = 2000;
    const TRAIL_SAMPLE_RATE = 16;
    const MAX_TRAIL_POINTS = Math.ceil(TRAIL_LIFETIME / TRAIL_SAMPLE_RATE);
    const TRAIL_MIN_STRENGTH = 0.01;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;

    const initGrid = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      trailRef.current = [];

      cols = Math.ceil(width / GRID_SPACING) + 1;
      rows = Math.ceil(height / GRID_SPACING) + 1;

      const points: Point[] = [];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * GRID_SPACING;
          const y = j * GRID_SPACING;
          points.push({
            x,
            y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
          });
        }
      }
      pointsRef.current = points;
    };

    const updateTrail = (mouseX: number, mouseY: number, now: number) => {
      trailRef.current.push({
        x: mouseX,
        y: mouseY,
        timestamp: now,
        strength: 1,
      });

      if (trailRef.current.length > MAX_TRAIL_POINTS) {
        trailRef.current.shift();
      }
    };

    const updateTrailStrengths = (now: number) => {
      const trail = trailRef.current;
      for (let i = trail.length - 1; i >= 0; i--) {
        const age = now - trail[i].timestamp;
        const strength = 1 - age / TRAIL_LIFETIME;
        if (strength <= TRAIL_MIN_STRENGTH) {
          trail.splice(i, 1);
        } else {
          trail[i].strength = strength;
        }
      }
    };

    const updatePoints = () => {
      const now = performance.now();
      updateTrailStrengths(now);

      pointsRef.current.forEach((point) => {
        let forceX = 0;
        let forceY = 0;

        // Apply wake forces from the trail
        trailRef.current.forEach((trailPoint) => {
          const dx = point.x - trailPoint.x;
          const dy = point.y - trailPoint.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq > MOUSE_RADIUS * MOUSE_RADIUS) return;

          const distance = Math.sqrt(distanceSq);
          const force =
            (1 - distance / MOUSE_RADIUS) *
            REPULSION_STRENGTH *
            trailPoint.strength;
          const angle = Math.atan2(dy, dx);
          forceX += Math.cos(angle) * force * 0.35;
          forceY += Math.sin(angle) * force * 0.35;
        });

        // Spring Return
        const springDx = point.originX - point.x;
        const springDy = point.originY - point.y;
        
        forceX += springDx * SPRING_STIFFNESS;
        forceY += springDy * SPRING_STIFFNESS;

        // Apply forces to velocity
        point.vx += forceX;
        point.vy += forceY;

        // Damping
        point.vx *= DAMPING;
        point.vy *= DAMPING;

        // Update position
        point.x += point.vx;
        point.y += point.vy;
      });
    };

    const drawGrid = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // We draw lines connecting neighboring points
      // Vertical lines: connect (i, j) to (i, j+1)
      // Horizontal lines: connect (i, j) to (i+1, j)

      ctx.lineWidth = 1;

      const getOpacity = (x: number, y: number) => {
        let maxIntensity = 0;

        trailRef.current.forEach((trailPoint) => {
          const dx = x - trailPoint.x;
          const dy = y - trailPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            const intensity =
              (1 - dist / MOUSE_RADIUS) * trailPoint.strength;
            if (intensity > maxIntensity) maxIntensity = intensity;
          }
        });

        return 0.04 + maxIntensity * 0.07;
      };

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const index = i * rows + j;
          const point = pointsRef.current[index];
          if (!point) continue;

          // Draw Right connection
          if (i < cols - 1) {
            const rightIndex = (i + 1) * rows + j;
            const rightPoint = pointsRef.current[rightIndex];
            if (rightPoint) {
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(rightPoint.x, rightPoint.y);
                
                // Calculate average opacity for the line
                const midX = (point.x + rightPoint.x) / 2;
                const midY = (point.y + rightPoint.y) / 2;
                ctx.strokeStyle = `rgba(255, 255, 255, ${getOpacity(midX, midY)})`;
                ctx.stroke();
            }
          }

          // Draw Bottom connection
          if (j < rows - 1) {
            const bottomIndex = i * rows + (j + 1);
            const bottomPoint = pointsRef.current[bottomIndex];
            if (bottomPoint) {
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(bottomPoint.x, bottomPoint.y);
                
                // Calculate average opacity
                const midX = (point.x + bottomPoint.x) / 2;
                const midY = (point.y + bottomPoint.y) / 2;
                ctx.strokeStyle = `rgba(255, 255, 255, ${getOpacity(midX, midY)})`;
                ctx.stroke();
            }
          }
        }
      }
    };

    const animate = () => {
      updatePoints();
      drawGrid();
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      initGrid();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();

      if (now - lastTrailSampleRef.current >= TRAIL_SAMPLE_RATE) {
        updateTrail(x, y, now);
        lastTrailSampleRef.current = now;
      }
    };

    const handleMouseLeave = () => {
      lastTrailSampleRef.current = 0;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave); // Optional: reset on leave

    initGrid();
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}

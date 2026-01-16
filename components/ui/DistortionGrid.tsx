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

export default function DistortionGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const pointsRef = useRef<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configuration
    const GRID_SPACING = 50;
    const MOUSE_RADIUS = 180;
    const REPULSION_STRENGTH = 1; // Adjusted for subtle effect
    const SPRING_STIFFNESS = 0.02;
    const DAMPING = 0.3;
    
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

    const updatePoints = () => {
      const mouse = mouseRef.current;
      
      pointsRef.current.forEach((point) => {
        // Distance from mouse to point's ORIGIN (stable interaction)
        const dx = point.x - mouse.x;
        const dy = point.y - mouse.y;
        const distanceSq = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSq);

        let forceX = 0;
        let forceY = 0;

        // Mouse Repulsion
        if (distance < MOUSE_RADIUS) {
          const force = (1 - distance / MOUSE_RADIUS) * REPULSION_STRENGTH;
          const angle = Math.atan2(dy, dx);
          forceX += Math.cos(angle) * force * 0.5; // Scale down for control
          forceY += Math.sin(angle) * force * 0.5;
        }

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

      const mouse = mouseRef.current;

      // Helper to calculate opacity based on distance to mouse
      const getOpacity = (x: number, y: number) => {
        const dx = x - mouse.x;
        const dy = y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          // Fade from 0.15 at center to 0.04 at edge
          const intensity = 1 - dist / MOUSE_RADIUS;
          return 0.04 + intensity * 0.11; 
        }
        return 0.04;
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
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
        mouseRef.current = { x: -1000, y: -1000 };
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

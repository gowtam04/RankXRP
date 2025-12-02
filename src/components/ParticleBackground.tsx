'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 100,
      size: Math.random() * 3 + 1,
      speedY: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.3 + 0.1,
      wobble: 0,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
    });

    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 20000);
      for (let i = 0; i < particleCount; i++) {
        const particle = createParticle();
        particle.y = Math.random() * canvas.height;
        particles.push(particle);
      }
    };

    const drawParticle = (particle: Particle) => {
      if (!ctx) return;

      // Create gradient for bioluminescent effect
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size * 2
      );
      gradient.addColorStop(0, `rgba(34, 211, 238, ${particle.opacity})`);
      gradient.addColorStop(0.5, `rgba(14, 165, 233, ${particle.opacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core bright point
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.8})`;
      ctx.fill();
    };

    const updateParticle = (particle: Particle) => {
      particle.y -= particle.speedY;
      particle.wobble += particle.wobbleSpeed;
      particle.x += Math.sin(particle.wobble) * 0.3;

      // Reset particle when it goes off screen
      if (particle.y < -10) {
        particle.y = canvas.height + 10;
        particle.x = Math.random() * canvas.width;
      }
    };

    const animate = () => {
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        updateParticle(particle);
        drawParticle(particle);
      });

      animationId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

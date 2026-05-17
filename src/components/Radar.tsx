import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../game/engine';
import { Team } from '../types';

export const Radar: React.FC<{ engine: GameEngine }> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const renderRadar = () => {
      if (!canvasRef.current || !engine.player) {
         animationFrameId = requestAnimationFrame(renderRadar);
         return;
      }
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
         animationFrameId = requestAnimationFrame(renderRadar);
         return;
      }

      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      ctx.clearRect(0, 0, width, height);

      const player = engine.player;
      if (player.health <= 0) {
         animationFrameId = requestAnimationFrame(renderRadar);
         return;
      }

      const cx = width / 2;
      const cy = height / 2;
      const radarRadius = cx - 4;
      const radarRange = 4000;

      // Draw grid/background
      ctx.beginPath();
      ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // inner ring
      ctx.beginPath();
      ctx.arc(cx, cy, radarRadius * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, cy - radarRadius);
      ctx.lineTo(cx, cy + radarRadius);
      ctx.moveTo(cx - radarRadius, cy);
      ctx.lineTo(cx + radarRadius, cy);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.stroke();

      // Rotate the whole canvas so that player's forward is UP
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-player.angle - Math.PI / 2);

      // Draw Compass headings
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const labelDist = radarRadius - 10;
      ctx.fillText('E', labelDist, 0); // +x
      ctx.fillText('W', -labelDist, 0); // -x
      ctx.fillText('S', 0, labelDist); // +y
      ctx.fillText('N', 0, -labelDist); // -y

      // Draw Ships
      engine.ships.forEach(ship => {
        if (ship.health <= 0 || ship.id === player.id) return;
        
        const dx = ship.x - player.x;
        const dy = ship.y - player.y;
        
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radarRange) return;

        const scale = radarRadius / radarRange;
        const px = dx * scale;
        const py = dy * scale;

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = ship.team === Team.PLAYER ? '#3b82f6' : '#ef4444';
        ctx.fill();
      });

      // Draw Motherships
      engine.motherships.forEach(ms => {
        if (ms.health <= 0) return;
        const dx = ms.x - player.x;
        const dy = ms.y - player.y;
        
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radarRange) return;

        const scale = radarRadius / radarRange;
        const px = dx * scale;
        const py = dy * scale;

        ctx.beginPath();
        ctx.rect(px - 5, py - 5, 10, 10);
        ctx.fillStyle = ms.team === Team.PLAYER ? '#60a5fa' : '#f87171';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.restore();

      // Draw Player (Center, always facing UP)
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx + 4, cy + 4);
      ctx.lineTo(cx - 4, cy + 4);
      ctx.closePath();
      ctx.fillStyle = '#60a5fa'; // player color
      ctx.fill();

      animationFrameId = requestAnimationFrame(renderRadar);
    };

    renderRadar();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engine]);

  return (
    <div className="fixed top-20 right-4 md:top-28 md:right-8 bg-slate-950/40 backdrop-blur-md rounded-full border border-blue-500/20 shadow-2xl p-2 pointer-events-auto z-50">
      <canvas ref={canvasRef} width={120} height={120} className="rounded-full opacity-80" />
    </div>
  );
};

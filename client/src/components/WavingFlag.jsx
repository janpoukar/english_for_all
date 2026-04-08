import { useEffect, useRef } from 'react';

export default function WavingFlag() {
  const canvasRef = useRef(null);
  const polesRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Vytvoř zdrojový canvas s britskou vlajkou
    const src = document.createElement('canvas');
    src.width = W;
    src.height = H;

    function drawUK(c) {
      const w = c.width, h = c.height;
      const cx = c.getContext('2d');

      cx.fillStyle = '#012169';
      cx.fillRect(0, 0, w, h);

      cx.save();
      cx.strokeStyle = '#FFFFFF';
      cx.lineWidth = h * 0.2;
      cx.beginPath();
      cx.moveTo(0, 0);
      cx.lineTo(w, h);
      cx.stroke();
      cx.beginPath();
      cx.moveTo(w, 0);
      cx.lineTo(0, h);
      cx.stroke();
      cx.restore();

      const redW = h * 0.133;
      cx.save();
      cx.strokeStyle = '#C8102E';
      cx.lineWidth = redW;

      cx.save();
      cx.beginPath();
      cx.rect(0, 0, w / 2, h / 2);
      cx.clip();
      cx.beginPath();
      cx.moveTo(0, 0);
      cx.lineTo(w, h);
      cx.stroke();
      cx.restore();

      cx.save();
      cx.beginPath();
      cx.rect(w / 2, h / 2, w / 2, h / 2);
      cx.clip();
      cx.beginPath();
      cx.moveTo(0, 0);
      cx.lineTo(w, h);
      cx.stroke();
      cx.restore();

      cx.save();
      cx.beginPath();
      cx.rect(w / 2, 0, w / 2, h / 2);
      cx.clip();
      cx.beginPath();
      cx.moveTo(w, 0);
      cx.lineTo(0, h);
      cx.stroke();
      cx.restore();

      cx.save();
      cx.beginPath();
      cx.rect(0, h / 2, w / 2, h / 2);
      cx.clip();
      cx.beginPath();
      cx.moveTo(w, 0);
      cx.lineTo(0, h);
      cx.stroke();
      cx.restore();

      cx.restore();

      cx.save();
      cx.strokeStyle = '#FFFFFF';
      cx.lineWidth = h * 0.333;
      cx.beginPath();
      cx.moveTo(w / 2, 0);
      cx.lineTo(w / 2, h);
      cx.stroke();
      cx.beginPath();
      cx.moveTo(0, h / 2);
      cx.lineTo(w, h / 2);
      cx.stroke();
      cx.restore();

      cx.save();
      cx.strokeStyle = '#C8102E';
      cx.lineWidth = h * 0.2;
      cx.beginPath();
      cx.moveTo(w / 2, 0);
      cx.lineTo(w / 2, h);
      cx.stroke();
      cx.beginPath();
      cx.moveTo(0, h / 2);
      cx.lineTo(w, h / 2);
      cx.stroke();
      cx.restore();
    }

    drawUK(src);

    const SEGS_X = 80,
      SEGS_Y = 48;
    const cellW = W / SEGS_X,
      cellH = H / SEGS_Y;

    function wave(nx, ny, t) {
      const amp = 14 * nx;
      const secondary = 3.5 * nx * Math.sin(ny * Math.PI * 1.7 + t * 1.3);
      return Math.sin(nx * 2.2 * Math.PI + t * 2.6) * amp + secondary;
    }

    function waveX(nx, ny, t) {
      return nx * W + Math.sin(nx * 2.8 + t * 2.0) * nx * 5;
    }

    let t = 0;
    let animationId;

    function render() {
      ctx.clearRect(0, 0, W, H);

      for (let row = 0; row < SEGS_Y; row++) {
        for (let col = 0; col < SEGS_X; col++) {
          const nx0 = col / SEGS_X,
            ny0 = row / SEGS_Y;
          const nx1 = (col + 1) / SEGS_X,
            ny1 = (row + 1) / SEGS_Y;

          const tl = { x: waveX(nx0, ny0, t), y: ny0 * H + wave(nx0, ny0, t) };
          const tr = { x: waveX(nx1, ny0, t), y: ny0 * H + wave(nx1, ny0, t) };
          const br = { x: waveX(nx1, ny1, t), y: ny1 * H + wave(nx1, ny1, t) };
          const bl = { x: waveX(nx0, ny1, t), y: ny1 * H + wave(nx0, ny1, t) };

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(tl.x, tl.y);
          ctx.lineTo(tr.x, tr.y);
          ctx.lineTo(br.x, br.y);
          ctx.lineTo(bl.x, bl.y);
          ctx.closePath();
          ctx.clip();

          const srcX = col * cellW,
            srcY = row * cellH;
          const minY = Math.min(tl.y, tr.y, bl.y, br.y) - 2;
          const maxY = Math.max(tl.y, tr.y, bl.y, br.y) + 2;
          const minX = Math.min(tl.x, bl.x) - 1;

          ctx.drawImage(
            src,
            srcX,
            srcY,
            cellW + 1,
            cellH + 1,
            minX,
            minY,
            cellW + 3,
            maxY - minY + 4
          );
          ctx.restore();
        }
      }

      addShading();
      t += 0.022;
      animationId = requestAnimationFrame(render);
    }

    function addShading() {
      for (let col = 0; col <= SEGS_X; col++) {
        const nx = col / SEGS_X;
        const wv = Math.sin(nx * 2.2 * Math.PI + t * 2.6);
        const alpha = wv * 0.09 * nx;
        if (Math.abs(alpha) < 0.001) continue;
        const x = waveX(nx, 0.5, t);
        ctx.fillStyle =
          alpha > 0
            ? `rgba(0,0,0,${alpha})`
            : `rgba(255,255,255,${-alpha * 0.5})`;
        ctx.fillRect(x - 1, 0, W / SEGS_X + 2, H);
      }
    }

    render();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="flex items-start gap-4">
      <div
        ref={polesRef}
        className="w-1.5 bg-gradient-to-b from-gray-400 via-gray-200 to-gray-500 rounded-t"
        style={{ height: '300px' }}
      />
      <div>
        <canvas
          ref={canvasRef}
          width={480}
          height={240}
          className="rounded"
          style={{ display: 'block', marginTop: '12px' }}
        />
      </div>
    </div>
  );
}

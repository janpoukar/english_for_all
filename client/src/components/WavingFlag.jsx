import { useEffect, useRef } from 'react';

export default function WavingFlag() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const W = 640, H = 360;
    const gl = cv.getContext('webgl');

    const vsrc = `
      attribute vec2 a_pos;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      void main(){
        gl_Position = vec4(a_pos, 0, 1);
        v_uv = a_uv;
      }`;

    const fsrc = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      void main(){
        gl_FragColor = texture2D(u_tex, v_uv);
      }`;

    function createShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vsrc));
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fsrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    const aUV = gl.getAttribLocation(prog, 'a_uv');
    const uTex = gl.getUniformLocation(prog, 'u_tex');

    const NX = 120, NY = 72;
    const verts = new Float32Array(NX * NY * 2);
    const uvs = new Float32Array(NX * NY * 2);
    const indices = [];

    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const idx = (j * NX + i) * 2;
        uvs[idx + 0] = i / (NX - 1);
        uvs[idx + 1] = j / (NY - 1);
      }
    }

    for (let j = 0; j < NY - 1; j++) {
      for (let i = 0; i < NX - 1; i++) {
        const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    /* Kreslení vlajky na canvas texturu */
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 640;
    flagCanvas.height = 360;
    const fc = flagCanvas.getContext('2d');
    const fw = 512, fh = 256;

    fc.fillStyle = '#012169';
    fc.fillRect(0, 0, fw, fh);

    fc.save();
    fc.strokeStyle = '#FFFFFF';
    fc.lineWidth = fh * 0.2;
    fc.beginPath();
    fc.moveTo(0, 0);
    fc.lineTo(fw, fh);
    fc.stroke();
    fc.beginPath();
    fc.moveTo(fw, 0);
    fc.lineTo(0, fh);
    fc.stroke();
    fc.restore();

    fc.save();
    fc.strokeStyle = '#C8102E';
    fc.lineWidth = fh * 0.133;
    [
      [0, 0, fw / 2, fh / 2, 0, 0],
      [fw / 2, fh / 2, fw, fh, fw / 2, fh / 2],
      [fw / 2, 0, fw, fh / 2, fw / 2, 0],
      [0, fh / 2, fw / 2, fh, 0, fh / 2]
    ].forEach(([x1, y1, x2, y2, cx, cy]) => {
      fc.save();
      fc.beginPath();
      fc.rect(cx, cy, fw / 2, fh / 2);
      fc.clip();
      const d = (x1 === 0 && y1 === 0) || (x1 === fw / 2 && y1 === fh / 2) ? 0 : 1;
      const dirs = [
        [0, 0, fw, fh],
        [fw, 0, 0, fh]
      ];
      fc.beginPath();
      fc.moveTo(dirs[d][0], dirs[d][1]);
      fc.lineTo(dirs[d][2], dirs[d][3]);
      fc.stroke();
      fc.restore();
    });
    fc.restore();

    fc.save();
    fc.strokeStyle = '#FFFFFF';
    fc.lineWidth = fh * 0.333;
    fc.beginPath();
    fc.moveTo(fw / 2, 0);
    fc.lineTo(fw / 2, fh);
    fc.stroke();
    fc.beginPath();
    fc.moveTo(0, fh / 2);
    fc.lineTo(fw, fh / 2);
    fc.stroke();
    fc.restore();

    fc.save();
    fc.strokeStyle = '#C8102E';
    fc.lineWidth = fh * 0.2;
    fc.beginPath();
    fc.moveTo(fw / 2, 0);
    fc.lineTo(fw / 2, fh);
    fc.stroke();
    fc.beginPath();
    fc.moveTo(0, fh / 2);
    fc.lineTo(fw, fh / 2);
    fc.stroke();
    fc.restore();

    /* Textura do WebGL */
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, flagCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(uTex, 0);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);

    /* Animační smyčka */
    let t = 0;
    let animationId;

    function frame() {
      t += 0.009;

      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const nx = i / (NX - 1);
          const ny = j / (NY - 1);
          const ease = nx * nx;

          const dy =
            Math.sin(nx * 2.0 * Math.PI + t * 2.4) * 18 * ease +
            Math.sin(nx * 3.8 * Math.PI + t * 1.7 + ny * 1.4) * 6 * ease +
            Math.sin(nx * 1.1 * Math.PI + t * 1.1 + ny * 2.6) * 2.5 * ease;
          const dx = Math.sin(nx * 2.5 + t * 1.8) * nx * 4.5;

          const px = (nx + dx / W) * 2 - 1;
          const py = 1 - (ny + dy / H) * 2;

          const idx = (j * NX + i) * 2;
          verts[idx + 0] = px;
          verts[idx + 1] = py;
        }
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts);
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      animationId = requestAnimationFrame(frame);
    }

    frame();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="flex items-start gap-3">
      <div
        className="w-1.5 bg-gradient-to-b from-gray-400 via-gray-200 to-gray-500 rounded-t"
        style={{ height: '300px' }}
      />
      <div>
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          style={{ display: 'block', marginTop: '12px', backgroundColor: 'transparent' }}
        />
      </div>
    </div>
  );
}

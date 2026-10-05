/* Renders every service clip into ../public/video/:
     <id>.mp4 (H.264), <id>.webm (VP9) and <id>.webp (poster, last calm frame).
   Usage: node render.mjs            — all
          node render.mjs voice-es   — only the ids given */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const SCENES = ['voice', 'docs', 'billing', 'assistant', 'infra', 'custom'];
const ALL = SCENES.flatMap((s) => [`${s}-es`, `${s}-en`]);
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const OUT = '../public/video';
/* System ffmpeg on Fedora ships without libx264; Remotion's bundled one has it.
   libwebp is the other way round, so the poster goes through the system one. */
/* The poster is the frame where every element is on screen — it is what a
   visitor with reduced motion sees instead of the clip. */
const POSTER_FRAME = 250;

mkdirSync('out', { recursive: true });
mkdirSync(OUT, { recursive: true });
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });

for (const id of ids) {
  console.log(`→ ${id}`);
  run('npx', ['remotion', 'render', 'src/index.ts', id, `out/${id}.mp4`, '--codec=h264', '--crf=8', '--log=error']);
  run('npx', ['remotion', 'ffmpeg', '-y', '-v', 'error', '-i', `out/${id}.mp4`, '-vf', 'scale=1200:800',
    '-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'animation', '-crf', '24', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-an', `${OUT}/${id}.mp4`]);
  run('ffmpeg', ['-y', '-v', 'error', '-i', `out/${id}.mp4`, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0',
    '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-an', `${OUT}/${id}.webm`]);
  run('npx', ['remotion', 'still', 'src/index.ts', id, `out/${id}.png`, `--frame=${POSTER_FRAME}`, '--log=error']);
  run('ffmpeg', ['-y', '-v', 'error', '-i', `out/${id}.png`, '-c:v', 'libwebp', '-quality', '82', `${OUT}/${id}.webp`]);
}

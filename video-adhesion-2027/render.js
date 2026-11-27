// Rend composition.html image par image et encode la piste vidéo (sans son).
//
//   node render.js video  <version> <largeur> <hauteur> <sortie.mp4>
//   node render.js stills <version> <largeur> <hauteur> <dossier> <t1,t2,...>
//
// Exemple : node render.js video generale 1080 1350 out/generale/muet.mp4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const [mode = 'video', version = 'generale', w = '1080', h = '1350', out = 'out/video.mp4', times = ''] = process.argv.slice(2);
const W = +w, H = +h;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('Erreur page :', e.message));
  const url = 'file://' + path.resolve(__dirname, 'composition.html') + `?v=${version}`;
  await page.goto(url);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  const { duration, fps } = await page.evaluate(() => ({ duration: TIMELINE.duration, fps: TIMELINE.fps }));

  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const t of times.split(',').map(Number)) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`) });
    }
    await browser.close();
    return;
  }

  const n = Math.ceil(duration * fps);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`${i}/${n} images (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log(`${out} : ${n} images, ${duration.toFixed(2)} s`);
})();

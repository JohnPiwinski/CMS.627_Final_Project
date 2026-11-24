import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chapterScripts, narrationEntries, parseChapter } from '../src/content.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const modelRevision = '5fe06641d0afecb3c04bc9faca2cf64d9b2b1600';
const sourceRevision = '4bf796d29ea775edd5a7cc5ee3a6806b3c3b91f6';
const voice = 'M2';
const encoding = ['-c:a', 'libmp3lame', '-b:a', '64k'];
const manifest = resolve(root, 'src/narration-assets.json');
const output = resolve(root, 'public/narration');
const cache = resolve(root, '.cache');
const exists = file => existsSync(resolve(root, file));

export function clipName(id, text) {
  const hash = createHash('sha256')
    .update(JSON.stringify([text, voice, modelRevision, sourceRevision, encoding])).digest('hex');
  return `${id}-${hash.slice(0, 16)}.mp3`;
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status ?? result.signal}`);
}

export function generateNarration() {
  const entries = chapterScripts.flatMap(file =>
    narrationEntries(parseChapter(readFileSync(resolve(root, file), 'utf8'), file)));
  if (new Set(entries.map(({ id }) => id)).size !== entries.length) {
    throw new Error('Narration IDs must be unique across chapters');
  }
  const assets = Object.fromEntries(entries.map(({ id, text }) => [id, {
    file: clipName(id, text),
    text,
  }]));
  const missing = entries.filter(({ id }) => !existsSync(resolve(output, assets[id].file)));
  if (missing.length) {
    mkdirSync(output, { recursive: true });
    mkdirSync(cache, { recursive: true });
    if (!exists('.cache/narration-ready')) {
      try { run('bash', ['scripts/setup-narration.sh']); }
      catch (error) { throw new Error(`Narration setup failed for ${missing.map(({ id }) => id).join(', ')}`, { cause: error }); }
    }
    const temp = mkdtempSync(resolve(cache, 'narration-'));
    try {
      for (const { id, text } of missing) {
        const transcript = resolve(temp, 'transcript.txt');
        const wav = resolve(temp, 'clip.wav');
        const mp3 = resolve(temp, 'clip.mp3');
        writeFileSync(transcript, text);
        try {
          run('.cache/tts/bin/python', ['-m', 'tiny_voca.infer', '--checkpoint', '.cache/weights/tiny-voca.pt',
            '--voice', voice, '--text-file', transcript, '--output', wav], {
            ...process.env, DIZIONE_DATA: resolve(cache, 'weights/phonemizer'), CUDA_VISIBLE_DEVICES: '',
          });
          run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', wav, ...encoding, mp3]);
          renameSync(mp3, resolve(output, assets[id].file));
        } catch (error) {
          throw new Error(`Failed to generate narration "${id}"`, { cause: error });
        }
      }
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }
  const json = JSON.stringify(assets, null, 2) + '\n';
  if (!existsSync(manifest) || readFileSync(manifest, 'utf8') !== json) {
    const temp = manifest + '.tmp';
    writeFileSync(temp, json);
    renameSync(temp, manifest);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) generateNarration();

// Runs the backend and the Vite dev server side by side (no extra dependency needed).
import { spawn, spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const tasks = {
  backend: 'npm run dev -w backend',
  frontend: 'npm run dev -w frontend',
};

const children = Object.entries(tasks).map(([name, command]) => {
  const child = spawn(command, { shell: true, stdio: ['inherit', 'pipe', 'pipe'] });
  const prefix = `[${name}] `;
  const pipe = (stream, out) =>
    stream.on('data', (chunk) => {
      const text = chunk.toString().replace(/\n(?!$)/g, `\n${prefix}`);
      out.write(prefix + text);
    });
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefix}exited with code ${code}`);
    shutdown(code ?? 0);
  });
  return child;
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    // On Windows, kill the whole process tree (npm → node), not just the shell.
    if (isWindows) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

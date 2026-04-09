const { spawn } = require('child_process');
const path = require('path');

const root = __dirname;

const services = [
  {
    name: 'backend',
    cwd: path.join(root, 'backend'),
    cmd: 'npm',
    args: ['run', 'start:dev'],
    env: {},
  },
  {
    name: 'web',
    cwd: path.join(root, 'web'),
    cmd: 'npm',
    args: ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5175'],
    env: {
      VITE_API_BASE_URL: 'http://127.0.0.1:4008',
    },
  },
  {
    name: 'mobile',
    cwd: path.join(root, 'mobile'),
    cmd: 'flutter',
    args: [
      'run',
      '-d',
      '0580DD06-7073-4FC6-AD41-B5860BFEDA62',
      '--dart-define=API_BASE_URL=http://127.0.0.1:4008',
    ],
    env: {},
  },
];

const children = [];
let shuttingDown = false;

function startService(service) {
  const child = spawn(service.cmd, service.args, {
    cwd: service.cwd,
    env: { ...process.env, ...service.env },
    stdio: 'inherit',
    shell: true,
  });

  children.push({ name: service.name, process: child });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason =
      signal != null ? `signal ${signal}` : `code ${code ?? 'unknown'}`;
    console.log(`\n[${service.name}] exited with ${reason}`);
  });

  child.on('error', (error) => {
    console.error(`\n[${service.name}] failed to start: ${error.message}`);
  });
}

function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log('\nStopping local stack...');

  for (const child of children) {
    if (!child.process.killed) {
      child.process.kill('SIGINT');
    }
  }

  setTimeout(() => {
    process.exit(0);
  }, 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

for (const service of services) {
  startService(service);
}

console.log('Starting Bunna Bank local stack...');
console.log('Backend: http://127.0.0.1:4008');
console.log('Web: http://localhost:5175');
console.log('Mobile target: iPhone 17 Pro simulator');

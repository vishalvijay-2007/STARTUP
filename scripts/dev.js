import { spawn } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const children = []

const run = (args, label) => {
  const child = spawn(npm, args, { stdio: 'inherit', shell: false })
  child.on('error', (error) => console.error(`[${label}] ${error.message}`))
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`[${label}] exited with code ${code}`)
  })
  children.push(child)
}

console.log('Starting Startup Management Platform...')
console.log('Frontend: http://localhost:5173')
console.log('Backend:  https://startup-api-3shs.onrender.com/')

run(['run', 'server'], 'server')
run(['--prefix', 'client', 'run', 'dev'], 'client')

const shutdown = () => {
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

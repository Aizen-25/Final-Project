const fs = require('fs')
const path = require('path')

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  let files = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) files = files.concat(walk(full))
    else if (e.isFile() && full.endsWith('.json')) files.push(full)
  }
  return files
}

const root = path.resolve(__dirname, '..')
const jsonFiles = walk(root)
let ok = true
for (const f of jsonFiles) {
  try {
    const s = fs.readFileSync(f, 'utf8')
    JSON.parse(s)
    console.log('OK:', path.relative(root, f))
  } catch (err) {
    ok = false
    console.error('ERROR:', path.relative(root, f), err.message)
  }
}

process.exit(ok ? 0 : 1)

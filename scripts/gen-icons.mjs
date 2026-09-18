// Generates simple branded PNG icons without any dependencies
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

function crc32(buf) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = []
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function makeIcon(size) {
  const cx = size / 2, cy = size / 2, r = size * 0.48
  const innerR = size * 0.30
  const handleR = size * 0.13
  const rgba = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const dx = x - cx, dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy)
      let [R, G, B, A] = [0, 0, 0, 0]
      if (d <= r) {
        // coffee cup body: warm brown gradient
        const t = y / size
        R = Math.round(200 - t * 60)
        G = Math.round(137 - t * 45)
        B = Math.round(74 - t * 30)
        // cream "foam" circle in middle
        if (Math.sqrt(dx * dx + (dy + size * 0.02) ** 2) <= innerR * 0.8 && dy < innerR * 0.4) {
          R = 243; G = 233; B = 220
        }
        // handle on the left (rtl cup)
        const hx = x - (cx - r * 0.95), hy = y - cy
        const hd = Math.sqrt(hx * hx + hy * hy)
        if (hd <= handleR && x < cx - innerR * 0.7) {
          R = 200; G = 137; B = 74
        }
        A = 255
      }
      rgba[i] = R; rgba[i + 1] = G; rgba[i + 2] = B; rgba[i + 3] = A
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
writeFileSync('public/icon-192.png', makeIcon(192))
writeFileSync('public/icon-512.png', makeIcon(512))
console.log('icons written')

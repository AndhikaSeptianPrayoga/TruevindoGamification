import { ASSETS } from '../assets'
import { gameSfx } from '../sfx'
import type { GameDefinition } from '../types'

/**
 * Picture Puzzle — sliding puzzle of the company picture.
 * Easy & interactive: slide animation, movable tiles highlighted,
 * numbered tiles, large preview, and sound.
 */
export const puzzle: GameDefinition = {
  key: 'puzzle',
  name: 'Picture Puzzle',
  emoji: '🧩',
  needsDpad: false,
  instructions: 'Tap a glowing tile (next to the empty slot) to slide it. Only 4 pieces — easy!',
  start(api) {
    const { ctx, W, H } = api
    const N = 2 // 2x2 = only 3 sliding tiles (kept easy on purpose)
    const SIZE = Math.min(W, H - 150) - 20 // board pixel size
    const TILE = SIZE / N
    const ox = (W - SIZE) / 2
    const oy = 84 // board origin
    const BLANK = N * N - 1

    // Build the fallback "logo" onto an offscreen canvas, then slice into tiles.
    const src = document.createElement('canvas')
    src.width = SIZE
    src.height = SIZE
    drawLogo(src.getContext('2d') as CanvasRenderingContext2D, SIZE)

    const tiles: number[] = []
    for (let i = 0; i < N * N; i++) {
      tiles.push(i) // tiles[pos] = tileId
    }
    let moves = 0
    let time = 0
    let solved = false
    let solvedT = 0
    let t = 0
    let finalScore = 0
    let anim: { from: number; to: number; fromX: number; fromY: number; k: number } | null = null

    shuffleEasy()

    const cellX = (pos: number) => ox + (pos % N) * TILE
    const cellY = (pos: number) => oy + Math.floor(pos / N) * TILE

    const imgReady = () => ASSETS.ready(ASSETS.puzzle)
    // Source slice for a given tile id, from the photo (centered square crop)
    // when loaded, otherwise from the vector-logo offscreen canvas.
    function srcSlice(id: number): [CanvasImageSource, number, number, number, number] {
      if (imgReady()) {
        const im = ASSETS.puzzle
        const iw = im.naturalWidth
        const ih = im.naturalHeight
        const side = Math.min(iw, ih)
        const cropX = (iw - side) / 2
        const cropY = (ih - side) / 2
        const cs = side / N
        return [im, cropX + (id % N) * cs, cropY + Math.floor(id / N) * cs, cs, cs]
      }
      return [src, (id % N) * TILE, Math.floor(id / N) * TILE, TILE, TILE]
    }

    api.onTap((pt) => {
      if (solved || anim) {
        return // ignore taps mid-slide
      }
      const cx = Math.floor((pt.x - ox) / TILE)
      const cy = Math.floor((pt.y - oy) / TILE)
      if (cx < 0 || cy < 0 || cx >= N || cy >= N) {
        return
      }
      const pos = cy * N + cx
      const blankPos = tiles.indexOf(BLANK)
      if (!isAdjacent(pos, blankPos)) {
        gameSfx.bump()
        return
      }

      // animate the tapped tile sliding into the blank slot
      anim = { from: pos, to: blankPos, fromX: cellX(pos), fromY: cellY(pos), k: 0 }
      ;[tiles[pos], tiles[blankPos]] = [tiles[blankPos], tiles[pos]]
      moves++
      gameSfx.slide()
    })

    api.loop((dt) => {
      t += dt
      if (!solved) {
        time += dt
      } else {
        solvedT += dt
        if (solvedT > 1.4) {
          api.done(finalScore || 120)
          return
        }
      }

      if (anim) {
        anim.k = Math.min(1, anim.k + dt * 9)
        if (anim.k >= 1) {
          anim = null
          if (checkSolved() && !solved) {
            solved = true
            finalScore = Math.max(150, 900 - moves * 10 - Math.min(250, Math.round(time * 3)))
            api.setScore(finalScore)
            gameSfx.win()
          }
        }
      }

      // ---- render ----
      ctx.fillStyle = '#0a2540'
      ctx.fillRect(0, 0, W, H)

      // header: moves + time + preview
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 18px Manrope, Segoe UI'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('🧩 Moves: ' + moves, 12, 30)
      ctx.fillText('⏱ ' + time.toFixed(1) + 's', 12, 54)

      const pv = 64
      if (imgReady()) {
        const im = ASSETS.puzzle
        const iw = im.naturalWidth
        const ih = im.naturalHeight
        const side = Math.min(iw, ih)
        ctx.drawImage(im, (iw - side) / 2, (ih - side) / 2, side, side, W - pv - 14, 14, pv, pv)
      } else {
        ctx.drawImage(src, 0, 0, SIZE, SIZE, W - pv - 14, 14, pv, pv)
      }
      ctx.strokeStyle = '#00c2a8'
      ctx.lineWidth = 2
      ctx.strokeRect(W - pv - 14, 14, pv, pv)
      ctx.fillStyle = '#9fc0ff'
      ctx.font = '11px Manrope, Segoe UI'
      ctx.textAlign = 'center'
      ctx.fillText('TARGET', W - pv / 2 - 14, 92)

      // board frame
      ctx.fillStyle = '#0c1d31'
      ctx.fillRect(ox - 6, oy - 6, SIZE + 12, SIZE + 12)

      const blankPos = tiles.indexOf(BLANK)
      const movable =
        !solved && !anim
          ? Array.from({ length: N * N }, (_, i) => i).filter((p) => isAdjacent(p, blankPos))
          : []

      for (let pos = 0; pos < N * N; pos++) {
        const id = tiles[pos]
        let dx = cellX(pos)
        let dy = cellY(pos)

        if (id === BLANK && !solved) {
          ctx.fillStyle = '#13314f'
          ctx.fillRect(dx, dy, TILE, TILE)
          continue
        }
        // slide animation for the moving tile
        if (anim && pos === anim.to) {
          const tx = cellX(anim.to)
          const ty = cellY(anim.to)
          dx = anim.fromX + (tx - anim.fromX) * anim.k
          dy = anim.fromY + (ty - anim.fromY) * anim.k
        }

        const sl = srcSlice(id)
        ctx.drawImage(sl[0], sl[1], sl[2], sl[3], sl[4], dx, dy, TILE, TILE)
        ctx.strokeStyle = 'rgba(10,37,64,.55)'
        ctx.lineWidth = 2
        ctx.strokeRect(dx + 1, dy + 1, TILE - 2, TILE - 2)

        // number badge so the order is obvious (kept easy)
        if (!solved) {
          ctx.fillStyle = 'rgba(10,37,64,.65)'
          ctx.beginPath()
          ctx.arc(dx + 18, dy + 18, 13, 0, 7)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 15px Manrope, Segoe UI'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(String(id + 1), dx + 18, dy + 19)
          ctx.textBaseline = 'alphabetic'
        }

        // highlight movable tiles with a pulsing accent border
        if (movable.includes(pos)) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 6)
          ctx.strokeStyle = `rgba(0,194,168,${0.5 + pulse * 0.5})`
          ctx.lineWidth = 4
          ctx.strokeRect(dx + 3, dy + 3, TILE - 6, TILE - 6)
        }
      }

      if (solved) {
        ctx.fillStyle = 'rgba(0,194,168,.22)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 26px Manrope, Segoe UI'
        ctx.textAlign = 'center'
        ctx.fillText('Solved! ✅', W / 2, oy + SIZE + 44)
      }
    })

    // ---- helpers ----
    function isAdjacent(a: number, b: number) {
      const ax = a % N
      const ay = Math.floor(a / N)
      const bx = b % N
      const by = Math.floor(b / N)
      return Math.abs(ax - bx) + Math.abs(ay - by) === 1
    }
    function checkSolved() {
      return tiles.every((id, pos) => id === pos)
    }
    function shuffleEasy() {
      // Few random legal moves from solved -> always solvable AND easy.
      let blank = BLANK
      let prev = -1
      for (let i = 0; i < 8; i++) {
        const opts: number[] = []
        for (let pos = 0; pos < N * N; pos++) {
          if (isAdjacent(pos, blank) && pos !== prev) {
            opts.push(pos)
          }
        }
        const pick = opts[Math.floor(Math.random() * opts.length)]
        ;[tiles[pick], tiles[blank]] = [tiles[blank], tiles[pick]]
        prev = blank
        blank = pick
      }
      if (checkSolved()) {
        shuffleEasy() // never start solved
      }
    }

    function drawLogo(c: CanvasRenderingContext2D, s: number) {
      const g = c.createLinearGradient(0, 0, s, s)
      g.addColorStop(0, '#2f6fed')
      g.addColorStop(1, '#00c2a8')
      c.fillStyle = g
      c.fillRect(0, 0, s, s)
      // abstract corporate marks
      c.fillStyle = 'rgba(255,255,255,.12)'
      c.beginPath()
      c.arc(s * 0.8, s * 0.2, s * 0.35, 0, 7)
      c.fill()
      c.fillStyle = 'rgba(255,176,32,.9)'
      c.beginPath()
      c.moveTo(s * 0.15, s * 0.85)
      c.lineTo(s * 0.35, s * 0.45)
      c.lineTo(s * 0.5, s * 0.7)
      c.lineTo(s * 0.7, s * 0.3)
      c.lineTo(s * 0.85, s * 0.55)
      c.lineTo(s * 0.85, s * 0.85)
      c.closePath()
      c.fill()
      // big "T"
      c.fillStyle = '#fff'
      c.font = `bold ${s * 0.55}px Manrope, Segoe UI`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText('T', s / 2, s * 0.46)
      c.font = `bold ${s * 0.09}px Manrope, Segoe UI`
      c.fillText('TRUEVINDO', s / 2, s * 0.9)
      // strong grid lines so tiles are clearly distinguishable
      c.strokeStyle = 'rgba(255,255,255,.45)'
      c.lineWidth = 2
      for (let i = 1; i < N; i++) {
        c.beginPath()
        c.moveTo((s / N) * i, 0)
        c.lineTo((s / N) * i, s)
        c.stroke()
        c.beginPath()
        c.moveTo(0, (s / N) * i)
        c.lineTo(s, (s / N) * i)
        c.stroke()
      }
    }
  },
}

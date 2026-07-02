import { ASSETS } from '../assets'
import { gameSfx } from '../sfx'
import type { GameDefinition } from '../types'

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

/** Coffee Run — an office snake collecting coffee cups. */
export const snake: GameDefinition = {
  key: 'snake',
  name: 'Coffee Run',
  emoji: '🐍',
  needsDpad: true,
  instructions: 'Swipe / arrows / d-pad to steer. Collect coffee, avoid crashing.',
  start(api) {
    const { ctx, W, H } = api
    const COLS = 16
    const ROWS = 24
    const CELL = W / COLS // 25px cells -> 400x600
    const SNAKE_HEAD_CROP = { x: 0.342, y: 0.142, w: 0.316, h: 0.474 } // helmet only
    let body = [
      { x: 8, y: 12 },
      { x: 7, y: 12 },
      { x: 6, y: 12 },
    ]
    let dir = { x: 1, y: 0 }
    let nextDir = { x: 1, y: 0 }
    let food = randCell()
    let score = 0
    let dead = false
    let deadT = 0
    let stepT = 0
    let stepInterval = 0.16

    function randCell() {
      let c: { x: number; y: number }
      do {
        c = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
      } while (body.some((s) => s.x === c.x && s.y === c.y))
      return c
    }

    api.onDir((d) => {
      const map = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
      } as const
      const nd = map[d]
      if (!nd) {
        return
      }
      if (nd.x === -dir.x && nd.y === -dir.y) {
        return // no reverse
      }
      if (nd.x !== nextDir.x || nd.y !== nextDir.y) {
        gameSfx.move()
      }
      nextDir = nd
    })

    function tick() {
      dir = nextDir
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y }
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        dead = true
        gameSfx.crash()
        return
      }
      if (body.some((s) => s.x === head.x && s.y === head.y)) {
        dead = true
        gameSfx.crash()
        return
      }
      body.unshift(head)
      if (head.x === food.x && head.y === food.y) {
        score += 12
        api.setScore(score)
        gameSfx.eat()
        food = randCell()
        stepInterval = Math.max(0.075, stepInterval - 0.004) // speed up
      } else {
        body.pop()
      }
    }

    api.loop((dt) => {
      if (!dead) {
        stepT += dt
        if (stepT >= stepInterval) {
          stepT = 0
          tick()
        }
      } else {
        deadT += dt
        if (deadT > 0.8) {
          api.done(score)
          return
        }
      }

      // bg
      ctx.fillStyle = '#0c2240'
      ctx.fillRect(0, 0, W, H)
      // grid (carpet tiles)
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = 'rgba(91,141,239,.06)'
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
          }
        }
      }

      // food = coffee cup (drawn vector so it always renders)
      drawCup(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2)

      // snake
      const pad = 2
      // body first (skip head)
      for (let i = body.length - 1; i >= 1; i--) {
        const s = body[i]
        const t = i / body.length
        ctx.fillStyle = `rgba(47,111,237,${1 - t * 0.6})`
        roundRect(ctx, s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 6)
        ctx.fill()
      }
      // head: astronaut helmet image inside a circular clip (hides bg corners)
      const head = body[0]
      const hx = head.x * CELL + pad
      const hy = head.y * CELL + pad
      const hs = CELL - pad * 2
      if (ASSETS.ready(ASSETS.snakeHead)) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(hx + hs / 2, hy + hs / 2, hs / 2, 0, 7)
        ctx.clip()
        ASSETS.drawCrop(ctx, ASSETS.snakeHead, SNAKE_HEAD_CROP, hx, hy, hs, hs)
        ctx.restore()
      } else {
        ctx.fillStyle = '#00c2a8'
        roundRect(ctx, hx, hy, hs, hs, 6)
        ctx.fill()
        ctx.fillStyle = '#07223f'
        ctx.fillRect(head.x * CELL + CELL / 2 - 5, head.y * CELL + CELL / 2 - 3, 3, 3)
        ctx.fillRect(head.x * CELL + CELL / 2 + 2, head.y * CELL + CELL / 2 - 3, 3, 3)
      }

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 22px Manrope, Segoe UI'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('☕ ' + score, 12, 28)
      if (dead) {
        ctx.fillStyle = 'rgba(226,69,91,.18)'
        ctx.fillRect(0, 0, W, H)
      }
    })

    function drawCup(cx: number, cy: number) {
      const w = 15
      const h = 14
      // glow so the food pops on the dark carpet
      ctx.fillStyle = 'rgba(255,176,32,.28)'
      ctx.beginPath()
      ctx.arc(cx, cy, 12, 0, 7)
      ctx.fill()
      // cup body
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, cx - w / 2, cy - h / 2, w, h - 3, 3)
      ctx.fill()
      // coffee surface
      ctx.fillStyle = '#6f4e37'
      ctx.fillRect(cx - w / 2 + 2, cy - h / 2 + 2, w - 4, 4)
      // handle
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx + w / 2, cy - 1, 4, -1, 1.4)
      ctx.stroke()
      // steam
      ctx.strokeStyle = 'rgba(255,255,255,.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx - 2, cy - h / 2)
      ctx.quadraticCurveTo(cx + 2, cy - h / 2 - 4, cx - 1, cy - h / 2 - 7)
      ctx.stroke()
    }
  },
}

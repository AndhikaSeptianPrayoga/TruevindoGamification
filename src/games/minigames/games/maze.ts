import { ASSETS, type Crop } from '../assets'
import { gameSfx } from '../sfx'
import type { GameDefinition } from '../types'

interface MazeCell {
  n: boolean
  e: boolean
  s: boolean
  w: boolean
  v: boolean
}

/** Find the Meeting Room — find the path from your desk to the meeting room. */
export const maze: GameDefinition = {
  key: 'maze',
  name: 'Find the Meeting Room',
  emoji: '🧭',
  needsDpad: true,
  instructions: 'Swipe / arrows / d-pad to reach the meeting room (🚩).',
  start(api) {
    const { ctx, W, H } = api
    const PLAYER_CROP = { x: 0.3, y: 0.06, w: 0.42, h: 0.92 }
    const GOAL_CROP = { x: 0.27, y: 0.07, w: 0.45, h: 0.9 }
    const COLS = 11
    const ROWS = 17 // odd numbers for maze grid
    const grid = genMaze(COLS, ROWS) // each cell: walls {n,e,s,w}
    const mw = W / COLS
    const mh = (H - 40) / ROWS // leave header space
    const offY = 40
    let px = 0
    let py = 0 // player cell
    const ex = COLS - 1
    const ey = ROWS - 1 // exit cell
    let steps = 0
    let time = 0
    let done = false
    let doneT = 0
    let finalScore = 0
    let pxF = 0
    let pyF = 0 // smooth render position

    api.onDir((d) => {
      if (done) {
        return
      }
      const c = grid[py][px]
      let moved = false
      if (d === 'up' && !c.n && py > 0) {
        py--
        steps++
        moved = true
      } else if (d === 'down' && !c.s && py < ROWS - 1) {
        py++
        steps++
        moved = true
      } else if (d === 'left' && !c.w && px > 0) {
        px--
        steps++
        moved = true
      } else if (d === 'right' && !c.e && px < COLS - 1) {
        px++
        steps++
        moved = true
      }
      if (moved) {
        gameSfx.move()
      } else {
        gameSfx.bump()
      }
      if (px === ex && py === ey && !done) {
        done = true
        gameSfx.win()
        const optimal = COLS + ROWS
        const timePenalty = Math.min(300, time * 6)
        const stepPenalty = Math.max(0, steps - optimal) * 4
        finalScore = Math.max(120, Math.round(800 - timePenalty - stepPenalty))
        api.setScore(finalScore)
      }
    })

    api.loop((dt) => {
      if (!done) {
        time += dt
      } else {
        doneT += dt
        if (doneT > 1.0) {
          api.done(finalScore || 120)
          return
        }
      }

      // smooth move
      pxF += (px - pxF) * Math.min(1, dt * 14)
      pyF += (py - pyF) * Math.min(1, dt * 14)

      ctx.fillStyle = '#0a2540'
      ctx.fillRect(0, 0, W, H)
      // header
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 18px Manrope, Segoe UI'
      ctx.textAlign = 'left'
      ctx.fillText('🧭 Steps: ' + steps, 10, 26)
      ctx.textAlign = 'right'
      ctx.fillText('⏱ ' + time.toFixed(1) + 's', W - 10, 26)

      // floor
      ctx.fillStyle = '#13314f'
      ctx.fillRect(0, offY, W, H - offY)

      // exit cell highlight
      ctx.fillStyle = 'rgba(0,194,168,.25)'
      ctx.fillRect(ex * mw, offY + ey * mh, mw, mh)

      // walls
      ctx.strokeStyle = '#5b8def'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const c = grid[y][x]
          const X = x * mw
          const Y = offY + y * mh
          ctx.beginPath()
          if (c.n) {
            ctx.moveTo(X, Y)
            ctx.lineTo(X + mw, Y)
          }
          if (c.w) {
            ctx.moveTo(X, Y)
            ctx.lineTo(X, Y + mh)
          }
          if (c.e) {
            ctx.moveTo(X + mw, Y)
            ctx.lineTo(X + mw, Y + mh)
          }
          if (c.s) {
            ctx.moveTo(X, Y + mh)
            ctx.lineTo(X + mw, Y + mh)
          }
          ctx.stroke()
        }
      }

      // exit (goal astronaut) + player astronaut
      const cell = Math.min(mw, mh)
      const sH = cell * 0.98
      const sW = sH * 0.66 // portrait, fits inside a cell
      drawSprite(ASSETS.mazeGoal, GOAL_CROP, ex * mw + mw / 2, offY + ey * mh + mh / 2, sW, sH, '🚩')
      drawSprite(ASSETS.mazePlayer, PLAYER_CROP, pxF * mw + mw / 2, offY + pyF * mh + mh / 2, sW, sH, '🧑')

      function drawSprite(
        img: HTMLImageElement,
        crop: Crop,
        cx: number,
        cy: number,
        w: number,
        h: number,
        fallbackEmoji: string,
      ) {
        if (ASSETS.drawCrop(ctx, img, crop, cx - w / 2, cy - h / 2, w, h)) {
          return
        }
        ctx.font = `${cell - 6}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(fallbackEmoji, cx, cy)
      }

      ctx.textBaseline = 'alphabetic'
      if (done) {
        ctx.fillStyle = 'rgba(0,194,168,.18)'
        ctx.fillRect(0, 0, W, H)
      }
    })

    // ---- maze generator (recursive backtracker) ----
    function genMaze(cols: number, rows: number): MazeCell[][] {
      const g: MazeCell[][] = []
      for (let y = 0; y < rows; y++) {
        const row: MazeCell[] = []
        for (let x = 0; x < cols; x++) {
          row.push({ n: true, e: true, s: true, w: true, v: false })
        }
        g.push(row)
      }
      const stack = [{ x: 0, y: 0 }]
      g[0][0].v = true
      while (stack.length) {
        const cur = stack[stack.length - 1]
        const ns: Array<['n' | 's' | 'e' | 'w', number, number]> = []
        const { x, y } = cur
        if (y > 0 && !g[y - 1][x].v) ns.push(['n', x, y - 1])
        if (y < rows - 1 && !g[y + 1][x].v) ns.push(['s', x, y + 1])
        if (x > 0 && !g[y][x - 1].v) ns.push(['w', x - 1, y])
        if (x < cols - 1 && !g[y][x + 1].v) ns.push(['e', x + 1, y])
        if (!ns.length) {
          stack.pop()
          continue
        }
        const [dir, nx, ny] = ns[Math.floor(Math.random() * ns.length)]
        const opp = { n: 's', s: 'n', e: 'w', w: 'e' } as const
        g[y][x][dir] = false
        g[ny][nx][opp[dir]] = false
        g[ny][nx].v = true
        stack.push({ x: nx, y: ny })
      }
      return g
    }
  },
}

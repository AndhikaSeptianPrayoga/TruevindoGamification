import { ASSETS } from '../assets'
import { gameSfx } from '../sfx'
import type { GameDefinition } from '../types'

/** Office Flappy — fly the astronaut past the office buildings. */
export const flappy: GameDefinition = {
  key: 'flappy',
  name: 'Office Flappy',
  emoji: '☕',
  needsDpad: false,
  instructions: 'You get 3 attempts. Tap / Space to fly past the buildings.',
  start(api) {
    const { ctx, W, H } = api
    const FLAP_CROP = { x: 0.27, y: 0.1, w: 0.46, h: 0.66 } // trims transparent margins
    const GRAV = 1500
    const FLAP = -430
    const GAP = 175
    const PIPE_W = 64
    const SPEED = 150
    const MAX_ATTEMPTS = 3
    let by = H / 2
    let vy = 0
    let time = 0
    let pipes: Array<{ x: number; top: number; scored: boolean }> = []
    let spawnT = 0
    let score = 0
    let dead = false
    let deadT = 0
    let attempt = 1
    let respawnT = 0
    let shake = 0

    function spawn() {
      const minTop = 60
      const maxTop = H - GAP - 120
      const top = minTop + Math.random() * (maxTop - minTop)
      pipes.push({ x: W + 10, top, scored: false })
    }
    spawn()

    // Reset the bird/pipes for the next attempt (score carries over).
    function resetRun() {
      by = H / 2
      vy = 0
      pipes = []
      spawn()
      spawnT = 0
      dead = false
      deadT = 0
      shake = 0
    }

    api.onTap(() => {
      if (respawnT > 0) {
        respawnT = 0
        vy = FLAP
        gameSfx.flap()
        return
      }
      if (!dead) {
        vy = FLAP
        gameSfx.flap()
      }
    })

    function building(x: number, y: number, w: number, h: number) {
      ctx.fillStyle = '#1b3a5e'
      ctx.fillRect(x, y, w, h)
      for (let wy = y + 14; wy < y + h - 8; wy += 26) {
        for (let wx = x + 10; wx < x + w - 12; wx += 20) {
          ctx.fillStyle = (wx + wy) % 3 === 0 ? 'rgba(255,176,32,.85)' : 'rgba(125,170,240,.35)'
          ctx.fillRect(wx, wy, 9, 12)
        }
      }
    }

    api.loop((dt) => {
      time += dt
      // physics
      if (respawnT > 0) {
        // brief "get ready" pause between attempts; bird floats in place
        respawnT -= dt
      } else if (!dead) {
        vy += GRAV * dt
        by += vy * dt
        spawnT += dt
        if (spawnT > 1.55) {
          spawnT = 0
          spawn()
        }
        pipes.forEach((p) => (p.x -= SPEED * dt))
        pipes = pipes.filter((p) => p.x + PIPE_W > -10)

        // scoring + collision
        const bx = 90
        const br = 16
        for (const p of pipes) {
          if (!p.scored && p.x + PIPE_W < bx) {
            p.scored = true
            score += 15
            api.setScore(score)
            gameSfx.score()
          }
          const inX = bx + br > p.x && bx - br < p.x + PIPE_W
          if (inX && (by - br < p.top || by + br > p.top + GAP)) {
            if (!dead) {
              gameSfx.crash()
              shake = 0.4
            }
            dead = true
          }
        }
        if (by + 16 > H - 24) {
          by = H - 24 - 16
          if (!dead) {
            gameSfx.crash()
            shake = 0.4
          }
          dead = true
        }
        if (by - 16 < 0) {
          by = 16
          vy = 0
        }
      } else {
        deadT += dt
        by = Math.min(H - 40, by + (vy += GRAV * dt) * dt)
        if (deadT > 0.9) {
          if (attempt < MAX_ATTEMPTS) {
            attempt++
            resetRun()
            respawnT = 1.2
          } else {
            api.done(score)
            return
          }
        }
      }

      // ---- render ----
      ctx.save()
      if (shake > 0) {
        shake = Math.max(0, shake - dt)
        ctx.translate((Math.random() - 0.5) * shake * 30, (Math.random() - 0.5) * shake * 30)
      }
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#0a2540')
      sky.addColorStop(1, '#16406b')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // skyline backdrop
      ctx.fillStyle = 'rgba(20,58,94,.6)'
      for (let i = 0; i < 6; i++) {
        const sx = ((i * 90 - ((time * 18) % 90)) + 540) % 540 - 70
        ctx.fillRect(sx, H - 150 - (i % 3) * 30, 60, 200)
      }

      // pipes as buildings
      pipes.forEach((p) => {
        building(p.x, 0, PIPE_W, p.top)
        building(p.x, p.top + GAP, PIPE_W, H - (p.top + GAP))
        ctx.fillStyle = '#5b8def'
        ctx.fillRect(p.x - 4, p.top - 12, PIPE_W + 8, 12)
        ctx.fillRect(p.x - 4, p.top + GAP, PIPE_W + 8, 12)
      })

      // ground
      ctx.fillStyle = '#0c1d31'
      ctx.fillRect(0, H - 24, W, 24)
      ctx.fillStyle = '#5b8def'
      for (let gx = -((time * SPEED) % 40); gx < W; gx += 40) {
        ctx.fillRect(gx, H - 24, 20, 4)
      }

      // player (astronaut) — alive while flying, dead on crash
      ctx.save()
      ctx.translate(90, by)
      ctx.rotate(Math.max(-0.5, Math.min(1.1, vy / 600)))
      const dw = 96
      const dh = 78
      const img = dead ? ASSETS.flappyDead : ASSETS.flappyAlive
      const drawn = ASSETS.drawCrop(ctx, img, FLAP_CROP, -dw / 2, -dh / 2, dw, dh)
      if (!drawn) {
        // fallback before image loads
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(0, 0, 16, 0, 7)
        ctx.fill()
      }
      ctx.restore()

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 30px Manrope, Segoe UI'
      ctx.textAlign = 'center'
      ctx.fillText(String(score), W / 2, 48)

      // attempts indicator (hearts)
      ctx.font = '20px Segoe UI'
      ctx.textAlign = 'left'
      let hearts = ''
      for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        hearts += i <= MAX_ATTEMPTS - (attempt - 1) ? '❤️' : '🖤'
      }
      ctx.fillText(hearts, 10, 30)

      ctx.restore()

      if (respawnT > 0) {
        ctx.fillStyle = 'rgba(10,37,64,.55)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.font = 'bold 26px Manrope, Segoe UI'
        ctx.fillText(`Attempt ${attempt} / ${MAX_ATTEMPTS}`, W / 2, H / 2 - 12)
        ctx.font = '16px Manrope, Segoe UI'
        ctx.fillStyle = '#cfe0ff'
        ctx.fillText('Tap to start', W / 2, H / 2 + 16)
      } else if (dead) {
        ctx.fillStyle = 'rgba(226,69,91,.18)'
        ctx.fillRect(0, 0, W, H)
      }
    })
  },
}

import { ASSETS } from '../assets'
import { gameSfx } from '../sfx'
import type { GameDefinition } from '../types'

/**
 * Astro Run — endless side-runner (Chrome-dino style). Jump only;
 * each obstacle you clear makes it faster.
 */
export const runner: GameDefinition = {
  key: 'runner',
  name: 'Astro Run',
  emoji: '🏃',
  needsDpad: false,
  instructions: 'Tap / Space to jump over the obstacles. Each one you clear speeds it up!',
  start(api) {
    const { ctx, W, H } = api
    const RUN_CROP = { x: 0.28, y: 0.1, w: 0.46, h: 0.66 }
    const JUMP_CROP = { x: 0.28, y: 0.07, w: 0.48, h: 0.72 }
    const groundY = 472 // ground top line (player feet rest here)
    const G = 2400
    const VJUMP = -840
    const px = 84 // fixed player x (center)
    let feet = groundY
    let vy = 0
    let onGround = true
    let speed = 235
    let score = 0
    let time = 0
    let dead = false
    let deadT = 0
    let shake = 0
    let obstacles: Array<{ x: number; w: number; h: number; passed: boolean }> = []
    let dist = 0
    let nextGap = 360

    function jump() {
      if (onGround && !dead) {
        vy = VJUMP
        onGround = false
        gameSfx.flap()
      }
    }
    api.onTap(jump)

    function spawn() {
      const h = [34, 44, 60][Math.floor(Math.random() * 3)]
      const w = Math.random() < 0.22 ? 50 : [24, 30][Math.floor(Math.random() * 2)]
      obstacles.push({ x: W + 20, w, h, passed: false })
    }

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    }

    function drawObstacle(o: { x: number; w: number; h: number }) {
      const x = o.x
      const y = groundY - o.h
      // office "hazard barrier"
      ctx.fillStyle = '#15324f'
      roundRect(x, y, o.w, o.h, 4)
      ctx.fill()
      ctx.strokeStyle = '#0a2540'
      ctx.lineWidth = 2
      ctx.stroke()
      // hazard chevrons
      ctx.fillStyle = '#ffb020'
      for (let i = 0; i < o.h; i += 14) {
        ctx.fillRect(x + 3, y + i + 3, o.w - 6, 6)
      }
      ctx.fillStyle = '#15324f'
      for (let i = 0; i < o.h; i += 14) {
        ctx.fillRect(x + 3, y + i + 7, o.w - 6, 4)
      }
    }

    api.loop((dt) => {
      if (!dead) {
        time += dt
        vy += G * dt
        feet += vy * dt
        if (feet >= groundY) {
          feet = groundY
          vy = 0
          onGround = true
        }

        const move = speed * dt
        dist += move
        obstacles.forEach((o) => (o.x -= move))

        const last = obstacles[obstacles.length - 1]
        if (dist > 140 && (!last || W - last.x >= nextGap)) {
          spawn()
          nextGap = Math.max(speed * 0.62, 200 + Math.random() * 170)
        }
        obstacles = obstacles.filter((o) => o.x + o.w > -10)

        // scoring + collision (player hitbox a bit smaller than sprite)
        const pw = 36
        const ph = 52
        const pl = px - pw / 2
        const pr = px + pw / 2
        const pt = feet - ph
        const pb = feet
        for (const o of obstacles) {
          const ol = o.x
          const orr = o.x + o.w
          const ot = groundY - o.h
          const ob = groundY
          if (!o.passed && orr < pl) {
            o.passed = true
            score += 10
            speed = Math.min(560, speed + 14)
            api.setScore(score)
            gameSfx.score()
          }
          if (pr > ol && pl < orr && pb > ot && pt < ob) {
            if (!dead) {
              gameSfx.crash()
              shake = 0.4
            }
            dead = true
          }
        }
      } else {
        deadT += dt
        if (deadT > 0.9) {
          api.done(score)
          return
        }
      }

      // ---- render ----
      ctx.save()
      if (shake > 0) {
        shake = Math.max(0, shake - dt)
        ctx.translate((Math.random() - 0.5) * shake * 26, (Math.random() - 0.5) * shake * 26)
      }

      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#0a2540')
      sky.addColorStop(1, '#16406b')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // parallax skyline
      ctx.fillStyle = 'rgba(20,58,94,.55)'
      for (let i = 0; i < 7; i++) {
        const bx = ((i * 80 - ((dist * 0.25) % 80)) + 560) % 560 - 80
        ctx.fillRect(bx, groundY - 120 - (i % 3) * 34, 54, 200)
      }

      // ground
      ctx.fillStyle = '#0c1d31'
      ctx.fillRect(0, groundY, W, H - groundY)
      ctx.strokeStyle = '#5b8def'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, groundY)
      ctx.lineTo(W, groundY)
      ctx.stroke()
      ctx.fillStyle = '#5b8def'
      for (let gx = -(dist % 44); gx < W; gx += 44) {
        ctx.fillRect(gx, groundY + 12, 22, 4)
      }

      // obstacles
      obstacles.forEach(drawObstacle)

      // player
      const dw = 92
      const dh = 86
      const bob = onGround ? Math.sin(time * 16) * 3 : 0 // running bob
      const img = onGround ? ASSETS.runnerRun : ASSETS.runnerJump
      const crop = onGround ? RUN_CROP : JUMP_CROP
      const drawn = ASSETS.drawCrop(ctx, img, crop, px - dw / 2, feet - dh + bob, dw, dh)
      if (!drawn) {
        ctx.fillStyle = '#fff'
        roundRect(px - 18, feet - 52, 36, 52, 8)
        ctx.fill()
      }

      // HUD
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 26px Manrope, Segoe UI'
      ctx.textAlign = 'center'
      ctx.fillText(String(score), W / 2, 44)
      ctx.font = '13px Manrope, Segoe UI'
      ctx.fillStyle = '#9fc0ff'
      ctx.textAlign = 'right'
      ctx.fillText('speed ' + Math.round(speed), W - 12, 26)

      ctx.restore()
      if (dead) {
        ctx.fillStyle = 'rgba(226,69,91,.18)'
        ctx.fillRect(0, 0, W, H)
      }
    })
  },
}

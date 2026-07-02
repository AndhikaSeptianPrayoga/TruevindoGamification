import puzzleUrl from '@/assets/minigames/puzzle.png'
import flappyAliveUrl from '@/assets/minigames/flappy-alive.png'
import flappyDeadUrl from '@/assets/minigames/flappy-dead.png'
import mazePlayerUrl from '@/assets/minigames/maze-player.png'
import mazeGoalUrl from '@/assets/minigames/maze-goal.png'
import snakeHeadUrl from '@/assets/minigames/snake-head.png'
import runnerRunUrl from '@/assets/minigames/runner-run.png'
import runnerJumpUrl from '@/assets/minigames/runner-jump.png'

function load(url: string): HTMLImageElement {
  const img = new Image()
  img.src = url
  return img
}

export interface Crop {
  x: number
  y: number
  w: number
  h: number
}

/** Preloaded sprites shared by all mini games (bundled via Vite). */
export const ASSETS = {
  puzzle: load(puzzleUrl),
  flappyAlive: load(flappyAliveUrl),
  flappyDead: load(flappyDeadUrl),
  mazePlayer: load(mazePlayerUrl),
  mazeGoal: load(mazeGoalUrl),
  snakeHead: load(snakeHeadUrl),
  runnerRun: load(runnerRunUrl),
  runnerJump: load(runnerJumpUrl),

  ready(img: HTMLImageElement | undefined): boolean {
    return Boolean(img && img.complete && img.naturalWidth > 0)
  },

  /**
   * Draw a fractional crop {x,y,w,h} (0..1 of natural size) into a dest rect.
   * Honors the current canvas transform. Returns false if not yet loaded.
   */
  drawCrop(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | undefined,
    c: Crop,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): boolean {
    if (!img || !ASSETS.ready(img)) {
      return false
    }
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    ctx.drawImage(img, c.x * iw, c.y * ih, c.w * iw, c.h * ih, dx, dy, dw, dh)
    return true
  },
}

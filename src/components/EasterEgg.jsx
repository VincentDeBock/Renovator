import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'

// Easter egg: press 't' and 'b' at the same time → confetti + a thank-you that
// shows for 5 seconds.
export default function EasterEgg() {
  const [showing, setShowing] = useState(false)
  const pressed = useRef(new Set())
  const activeRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    function isTypingTarget(el) {
      if (!el) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
    }

    function celebrate() {
      if (activeRef.current) return // don't restack while already running
      activeRef.current = true
      setShowing(true)

      const end = Date.now() + 1200
      ;(function frame() {
        confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 } })
        confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 } })
        if (Date.now() < end) requestAnimationFrame(frame)
      })()
      confetti({ particleCount: 140, spread: 100, origin: { y: 0.6 } })

      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setShowing(false)
        activeRef.current = false
      }, 5000)
    }

    function onKeyDown(e) {
      if (isTypingTarget(e.target)) return
      pressed.current.add(e.key.toLowerCase())
      if (pressed.current.has('t') && pressed.current.has('b')) celebrate()
    }
    function onKeyUp(e) {
      pressed.current.delete(e.key.toLowerCase())
    }
    function reset() {
      pressed.current.clear()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', reset)
      clearTimeout(timerRef.current)
    }
  }, [])

  if (!showing) return null

  return (
    <div className="easter" aria-live="polite">
      <span className="easter-text">Thanks Boppie!</span>
    </div>
  )
}

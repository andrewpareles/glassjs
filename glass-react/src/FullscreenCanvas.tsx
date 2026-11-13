import React, { useRef, useCallback, useEffect, forwardRef } from "react"

type FullscreenCanvasProps = {
    draw: (ctx: CanvasRenderingContext2D) => void,
    zIndex: number,
}

const FullscreenCanvas = forwardRef<HTMLCanvasElement, FullscreenCanvasProps>(function FSC({ draw, zIndex }, passedRef) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // draw what we want
        draw(ctx)

        // then request another frame
        requestAnimationFrame(render)
    }, [draw])

    // re-render canvas
    useEffect(() => {
        const frameId = render()
        if (frameId === undefined) return
        return () => cancelAnimationFrame(frameId)
    }, [render])


    // resize canvas automatically
    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current
            if (!canvas) return

            const dpr = window.devicePixelRatio || 1
            canvas.width = window.innerWidth * dpr
            canvas.height = window.innerHeight * dpr

            const ctx = canvas.getContext('2d')
            ctx?.scale(dpr, dpr)

        }

        resizeCanvas()

        window.addEventListener('resize', resizeCanvas)

        return () => window.removeEventListener('resize', resizeCanvas)
    }, [])

    return (<canvas
        ref={(ref) => {
            canvasRef.current = ref;
            if (typeof passedRef === 'function') passedRef(ref);
            else if (passedRef) passedRef.current = ref;
        }}
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: zIndex
        }}
    />
    )
}
)

export default FullscreenCanvas
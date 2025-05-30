import { useEffect, useRef, useState } from "react"
import { Stage, Layer, Image, Rect } from "react-konva"
import useImage from "use-image"

const ImagePreviewEditor = ({ imageSrc, imageWidth, imageHeight }) => {
	const [image] = useImage(imageSrc)

	// console.log("Image Width:", imageWidth)
	// console.log("Image Height:", imageHeight)

	// Define virtual size for our scene
	const sceneWidth = imageWidth
	const sceneHeight = imageHeight

	const [stageProperties, setStageProperties] = useState({
		width: sceneWidth,
		height: sceneHeight,
		x: 0,
		y: 0,
		resizeScale: 1,
		zoomScale: 1,
	})

	// Reference to parent container
	const containerRef = useRef(null)
	// Reference to the stage
	const stageRef = useRef(null)

	// Function to handle resize
	const updateSize = () => {
		if (!containerRef.current) return

		// Get container width
		const containerWidth = containerRef.current.offsetWidth

		// Calculate scale
		const scale = containerWidth / sceneWidth

		const resizeScale = scale / stageProperties.zoomScale

		// Update state with new dimensions
		setStageProperties((prev) => {
			return {
				...prev,
				width: sceneWidth * scale,
				height: sceneHeight * scale,
				resizeScale: resizeScale,
			}
		})
	}

	// Update on mount and when window resizes
	useEffect(() => {
		updateSize()
		window.addEventListener("resize", updateSize)

		return () => {
			window.removeEventListener("resize", updateSize)
		}
	}, [])

	const clamp = (value: number, min: number, max: number) => {
		return Math.min(Math.max(value, min), max)
	}

	const boundFunc = (pos: { x: number; y: number }, scale: number) => {
		// Ensure the position is within bounds based on the current scale
		const x = clamp(pos.x, 0, sceneWidth * (1 - scale))
		const y = clamp(pos.y, 0, sceneHeight * (1 - scale))
		return {
			x,
			y,
		}
	}

	const handleWheel = (e) => {
		e.evt.preventDefault()

		const stage = stageRef.current
		const oldScale = stage.scaleX()
		const pointer = stage.getPointerPosition()
		console.log("stage x " + stage.x())
		console.log("Resize scale" + " " + stageProperties.resizeScale)
		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale,
		}
		console.log("Mouse Point To:", mousePointTo)

		// how to scale? Zoom in? Or zoom out?
		let direction = e.evt.deltaY > 0 ? -1 : 1

		// when we zoom on trackpad, e.evt.ctrlKey is true
		// in that case lets revert direction
		if (e.evt.ctrlKey) {
			direction = -direction
		}

		const scaleBy = 1.01
		const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
		const newZoomScale = newScale / stageProperties.resizeScale
		// don't let scale go beyond image size
		if (newZoomScale <= 1) {
			return
		}

		let x = -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale
		let y = -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale

		const pos = boundFunc({ x, y }, newScale)
		setStageProperties((prev) => ({
			...prev,
			x: pos.x,
			y: pos.y,
			zoomScale: newZoomScale,
		}))
	}

	const handleDragBound = (pos) => {
		return boundFunc(pos, stageProperties.resizeScale * stageProperties.zoomScale)
	}

	const handleDragMove = (e) => {
		setStageProperties((prev) => ({
			...prev,
			x: e.target.x(),
			y: e.target.y(),
		}))
	}

	return (
		<>
			<button
				onClick={() => {
					console.log("Stage Size:", stageProperties)
				}}
			>
				Check Stage
			</button>
			<div ref={containerRef} className="w-full h-full">
				<Stage
					ref={stageRef}
					width={stageProperties.width}
					height={stageProperties.height}
					scaleX={stageProperties.resizeScale * stageProperties.zoomScale}
					scaleY={stageProperties.resizeScale * stageProperties.zoomScale}
					draggable
					onDragMove={handleDragMove}
					dragBoundFunc={handleDragBound}
					onWheel={handleWheel}
				>
					<Layer>
						<Image image={image} />
						<Rect fill="green" x={sceneWidth - 100} y={sceneHeight - 100} width={100} height={100} />
					</Layer>
				</Stage>
			</div>
		</>
	)
}

export default ImagePreviewEditor

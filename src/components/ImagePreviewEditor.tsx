import { nanoid } from "nanoid"
import { useEffect, useRef, useState } from "react"
import { Stage, Layer, Image, Rect, Transformer } from "react-konva"
import useImage from "use-image"
import { clampBounds } from "./utils"

const ImagePreviewEditor = ({ imageSrc, imageWidth, imageHeight }) => {
	const [image] = useImage(imageSrc)

	const [snipBoxes, setSnipBoxes] = useState<{ [id: string]: { x: number; y: number; width: number; height: number } }>({})
	const [selectedSnipBoxID, setSelectedSnipBoxID] = useState(null)

	const transformerRef = useRef(null)
	const snipBoxRefs = useRef(new Map())

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

		// Calculate new position based on scale
		const pos = clampBounds(
			{ x: stageProperties.x, y: stageProperties.y },
			{
				width: imageWidth,
				height: imageHeight,
			},
			{ x: stageProperties.x, y: stageProperties.y },
			{
				width: imageWidth,
				height: imageHeight,
			},
			{
				resizeScale: scale,
				zoomScale: stageProperties.zoomScale,
			}
		)

		// Update state with new dimensions
		setStageProperties((prev) => {
			return {
				...prev,
				x: pos.x,
				y: pos.y,
				width: sceneWidth * scale,
				height: sceneHeight * scale,
				resizeScale: scale,
			}
		})
	}

	// Update on mount and when window resizes
	useEffect(() => {
		if (selectedSnipBoxID && transformerRef.current) {
			// Get the node from the refs Map
			const node = snipBoxRefs.current.get(selectedSnipBoxID)
			transformerRef.current.nodes([node])
		} else if (transformerRef.current) {
			// Clear selection
			transformerRef.current.nodes([])
		}
		updateSize()
		window.addEventListener("resize", updateSize)

		return () => {
			window.removeEventListener("resize", updateSize)
		}
	}, [selectedSnipBoxID])

	// Click handler for stage
	const handleStageClick = (e) => {
		// If did not click on a rectange, clear selection
		if (e.target === e.target.getStage() || !e.target.hasName("rect")) {
			setSelectedSnipBoxID(null)
			return
		}

		const clickedId = e.target.id()

		setSelectedSnipBoxID(clickedId)
	}

	const handleWheel = (e) => {
		e.evt.preventDefault()

		const stage = stageRef.current
		const oldScale = stage.scaleX()
		const pointer = stage.getPointerPosition()
		const mousePointTo = {
			x: pointer.x / oldScale - stageProperties.x / oldScale,
			y: pointer.y / oldScale - stageProperties.y / oldScale,
		}

		// how to scale? Zoom in? Or zoom out?
		let direction = e.evt.deltaY > 0 ? 1 : -1

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
		const x = -(mousePointTo.x - pointer.x / newScale) * newScale
		const y = -(mousePointTo.y - pointer.y / newScale) * newScale

		const pos = clampBounds(
			{ x, y },
			{
				width: imageWidth,
				height: imageHeight,
			},
			{
				x: stageProperties.x,
				y: stageProperties.y,
			},
			{
				width: imageWidth,
				height: imageHeight,
			},
			{
				resizeScale: stageProperties.resizeScale,
				zoomScale: newZoomScale,
			}
		)
		setStageProperties((prev) => ({
			...prev,
			x: pos.x,
			y: pos.y,
			zoomScale: newZoomScale,
		}))
	}

	const handleDragBound = (pos) => {
		// return boundFunc(pos, stageProperties.resizeScale * stageProperties.zoomScale)
		// return clampBounds(pos)
		return clampBounds(
			pos,
			{
				width: imageWidth,
				height: imageHeight,
			},
			{
				x: stageProperties.x,
				y: stageProperties.y,
			},
			{
				width: imageWidth,
				height: imageHeight,
			},
			{
				resizeScale: stageProperties.resizeScale,
				zoomScale: stageProperties.zoomScale,
			}
		)
	}

	const handleDragMove = (e) => {
		if (e.target === e.target.getStage()) {
			// If dragging the stage, update stage position
			setStageProperties((prev) => ({
				...prev,
				x: e.target.x(),
				y: e.target.y(),
			}))
		}
	}

	const handleSnipBoxDragMove = (e) => {
		if (!e.target.hasName("rect")) {
			return
		}
		setSnipBoxes((prev) => {
			const newBoxes = { ...prev }
			const id = e.target.id()
			const node = snipBoxRefs.current.get(id)
			if (!node) return newBoxes
			// Get the position of the rectangle
			const pos = node.getClientRect()

			// Ensure the position is within bounds based on the current scale
			const minX = Math.min(0, imageWidth * (1 - stageProperties.zoomScale) * stageProperties.resizeScale)
			const minY = Math.min(0, imageHeight * (1 - stageProperties.zoomScale) * stageProperties.resizeScale)
			console.log("minX", minX, "minY", minY)
			const x = Math.max(minX, Math.min(0, pos.x))
			const y = Math.max(minY, Math.min(0, pos.y))

			newBoxes[id] = {
				...newBoxes[id],
				x: x,
				y: y,
			}
			return newBoxes
		})
	}

	const addSnipBox = () => {
		const newBox = {
			x: Math.random() * stageProperties.width,
			y: Math.random() * stageProperties.height,
			width: stageProperties.width,
			height: 100,
		}
		const newID = nanoid()
		setSnipBoxes((prev) => {
			return { ...prev, [newID]: newBox }
		})
	}

	return (
		<>
			<button
				onClick={(e) => {
					console.log(stageProperties, imageWidth, imageHeight)
				}}
			>
				Stage Properties
			</button>
			<button onClick={addSnipBox}>Fancy</button>
			<p>Zoom {stageProperties.zoomScale.toFixed(2)}</p>
			<div ref={containerRef} className="w-full h-full">
				<Stage
					ref={stageRef}
					x={stageProperties.x}
					y={stageProperties.y}
					width={stageProperties.width}
					height={stageProperties.height}
					scaleX={stageProperties.resizeScale * stageProperties.zoomScale}
					scaleY={stageProperties.resizeScale * stageProperties.zoomScale}
					onClick={handleStageClick}
					draggable
					onDragMove={handleDragMove}
					dragBoundFunc={handleDragBound}
					onWheel={handleWheel}
				>
					<Layer>
						<Image image={image} />
						{Object.entries(snipBoxes).map(([id, box]) => (
							<Rect
								key={id}
								id={id}
								ref={(node) => {
									if (node) {
										snipBoxRefs.current.set(id, node)
									}
								}}
								x={box.x}
								y={box.y}
								width={box.width}
								height={box.height}
								fill="rgba(255, 0, 0, 0.5)"
								stroke="red"
								strokeWidth={2}
								draggable
								onDragMove={handleSnipBoxDragMove}
								name={"rect"}
							/>
						))}

						{/* Single transformer for all selected shapes */}
						<Transformer
							ref={transformerRef}
							boundBoxFunc={(oldBox, newBox) => {
								// Limit resize
								if (newBox.width < 5 || newBox.height < 5) {
									return oldBox
								}
								return newBox
							}}
							rotateEnabled={false}
						/>
					</Layer>
				</Stage>
			</div>
		</>
	)
}

export default ImagePreviewEditor

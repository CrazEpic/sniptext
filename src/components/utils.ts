export const clampBounds = (
	pos: { x: number; y: number },
	shapeSize: { width: number; height: number },
	parentPosition: { x: number; y: number },
	parentShapeSize: { width: number; height: number },
	parentScale: { resizeScale: number; zoomScale: number }
) => {
	const minX = Math.min(0, parentShapeSize.width * (1 - parentScale.zoomScale) * parentScale.resizeScale)
	const minY = Math.min(0, parentShapeSize.height * (1 - parentScale.zoomScale) * parentScale.resizeScale)
	const maxX = (parentPosition.x + parentShapeSize.width - shapeSize.width) * (1 - parentScale.zoomScale) * parentScale.resizeScale
	const maxY = (parentPosition.y + parentShapeSize.height - shapeSize.height) * (1 - parentScale.zoomScale) * parentScale.resizeScale
	const x = Math.max(minX, Math.min(maxX, pos.x))
	const y = Math.max(minY, Math.min(maxY, pos.y))
	return { x, y }
}

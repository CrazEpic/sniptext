import { useEffect, useState } from "react"

const SnipBoxOCRPreview = ({ imageSrc, imageLeft, imageTop, imageWidth, imageHeight, textOCR, processing }) => {
	const [croppedImageSrc, setCroppedImageSrc] = useState("")

	useEffect(() => {
		const loadImage = async () => {
			const image = new Image()
			image.src = imageSrc
			const canvas = document.createElement("canvas")
			canvas.width = imageWidth
			canvas.height = imageHeight
			const ctx = canvas.getContext("2d")
			ctx.drawImage(image, imageLeft, imageTop, imageWidth, imageHeight, 0, 0, imageWidth, imageHeight)
			const croppedURL = canvas.toDataURL("image/png")
			setCroppedImageSrc(croppedURL)
            console.log("Cropped Image Source:", croppedURL) // Debugging line to check the cropped image source
		}
		loadImage()
	}, [imageHeight, imageLeft, imageSrc, imageTop, imageWidth])

	return (
		<div className="flex flex-row">
			<img src={croppedImageSrc} width={100} />
			{processing && (
				<>
					<div className="w-full h-5 skeleton"></div>
				</>
			)}
			{!processing && <textarea className="w-full border border-gray-300 p-2" value={textOCR} readOnly />}
		</div>
	)
}

export default SnipBoxOCRPreview

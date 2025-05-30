import { useState } from "react"
import { createWorker } from "tesseract.js"
import ImagePreviewEditor from "./components/ImagePreviewEditor"

const App = () => {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined)
	const [imageWidth, setImageWidth] = useState<number>(0)
	const [imageHeight, setImageHeight] = useState<number>(0)
	const [extractedText, setExtractedText] = useState<string>("")
	const [textSkeletonFlag, setTextSkeletonFlag] = useState<boolean>(false)

	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			const url = URL.createObjectURL(file)
			const img = new Image()
			img.src = url
			await img.decode()
			setImageWidth(img.width)
			setImageHeight(img.height)
			setImageSrc(URL.createObjectURL(file))
		} else {
			setImageSrc(undefined)
		}
	}

	const extractTextFromImage = async (filepath: string) => {
		const worker = await createWorker(["eng", "jpn"])
		const result = await worker.recognize(filepath)
		await worker.terminate()
		return result.data.text
	}

	return (
		<>
			<div className="flex flex-row flex-wrap max-w-screen h-min p-4 gap-4">
				<div className="min-w-[300px] grow basis-0">
					<div className="flex flex-row">
						<label>
							<p>Your Image File (PNG/JPEG):</p>
							<input className="border-black bg-blue-300" onChange={handleImageUpload} type="file" accept="image/png, image/jpeg" />
						</label>
						<button>Fancy button</button>
					</div>
					{imageSrc ? (
						<ImagePreviewEditor imageSrc={imageSrc} imageWidth={imageWidth} imageHeight={imageHeight} />
					) : (
						<p className="text-red-500">No image loaded.</p>
					)}
				</div>
				<div className="min-w-[300px] grow basis-0">
					<button
						className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
						onClick={async () => {
							if (imageSrc) {
								setTextSkeletonFlag(true)
								const text = await extractTextFromImage(imageSrc)
								setExtractedText(text)
								setTextSkeletonFlag(false)
							}
						}}
					>
						Extract Text
					</button>
					<p>Extracted Text:</p>
					{textSkeletonFlag && (
						<>
							<div className="w-full h-5 skeleton"></div>
						</>
					)}
					{!textSkeletonFlag && <textarea className="w-full border border-gray-300 p-2" value={extractedText} readOnly />}
				</div>
			</div>
		</>
	)
}

export default App

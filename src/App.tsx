import { useState } from "react"
import { createWorker } from "tesseract.js"
import ImagePreviewEditor from "./components/ImagePreviewEditor"
import SnipBoxOCRPreview from "./components/SnipBoxOCRPreview"

const App = () => {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined)
	const [imageWidth, setImageWidth] = useState<number>(0)
	const [imageHeight, setImageHeight] = useState<number>(0)
	const [extractedText, setExtractedText] = useState<string>("")
	const [processing, setProcessing] = useState<boolean>(false)

	const [snipBoxes, setSnipBoxes] = useState<{ [id: string]: { x: number; y: number; width: number; height: number; text: string } }>({})

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
					</div>
					{imageSrc ? (
						<ImagePreviewEditor
							imageSrc={imageSrc}
							imageWidth={imageWidth}
							imageHeight={imageHeight}
							snipBoxes={snipBoxes}
							setSnipBoxes={setSnipBoxes}
						/>
					) : (
						<p className="text-red-500">No image loaded.</p>
					)}
				</div>
				<div className="min-w-[300px] grow basis-0">
					{imageSrc && (
						<button
							className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
							onClick={async () => {
								if (imageSrc) {
									setProcessing(true)
									const text = await extractTextFromImage(imageSrc)
									setExtractedText(text)
									setProcessing(false)
								}
							}}
						>
							Extract Text
						</button>
					)}
					{!imageSrc && (
						<button className="bg-gray-500 text-white px-4 py-2 rounded opacity-50" disabled>
							No image to extract text from
						</button>
					)}
					{/* {imageSrc && <SnipBoxOCRPreview imageSrc={imageSrc} textOCR={""} processing={false} />}{" "} */}
					{Object.entries(snipBoxes).length > 0 &&
						Object.entries(snipBoxes).map(([id, box]) => (
							<SnipBoxOCRPreview
								key={id}
								imageSrc={imageSrc}
								imageLeft={box.x}
								imageTop={box.y}
								imageWidth={box.width}
								imageHeight={box.height}
								textOCR={box.text}
								processing={processing}
							/>
						))}
				</div>
			</div>
		</>
	)
}

export default App

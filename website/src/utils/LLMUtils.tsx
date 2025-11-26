import { FetchImageLLMProps } from "../types/utils";


const apiImageParams: Record<string, string> = {
    "width": "960",
    "height": "720",
    "private": "true",
    "nologo": "true",
    "safe": "true"
};

const urlBase = `https://image.pollinations.ai/prompt`;


export async function fetchImageLLM({imagePrompt, params = {}, setImageContent}: FetchImageLLMProps) {
    // Assemble query params & corresponding URL
    const queryParams = new URLSearchParams({ ...apiImageParams, ...params });
    const encodedPrompt = encodeURIComponent(imagePrompt);

    const url = `${urlBase}/${encodedPrompt}?${queryParams.toString()}`;
    console.log("Fetching image from:", url);

    // Show spinner while image loading
    setImageContent(<div className="spinner"></div>);
    
    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(
                `HTTP error! status: ${response.status}, message: ${errorText}`
            );
        }

        // Set up HTML for image display, then update state with image
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);

        setImageContent(<img src={imageUrl} alt={imagePrompt} loading="lazy" />);

    // Update image container on error
    } catch (error: unknown) {
        console.error("Error fetching image:", error);
        setImageContent(<p>Error loading image.. try submitting again!</p>);
    }
}
    
    
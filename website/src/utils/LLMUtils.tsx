import { FetchImageLLMProps } from "../types/utils";


const API = import.meta.env.VITE_POLLINATIONS;

const apiImageParams: Record<string, string> = {
    "model": "flux",
    "width": "960",
    "height": "720",
    "safe": "true"

    // Params no longer supported :(
    // "private": "true",
    // "nologo": "true",
};

const urlBase = `https://gen.pollinations.ai/image`;


export async function fetchImageLLM({imagePrompt, params = {}, setImageContent}: FetchImageLLMProps) {
    // Assemble query params & corresponding URL
    const queryParams = new URLSearchParams({ ...apiImageParams, ...params });
    const encodedPrompt = encodeURIComponent(imagePrompt);

    const url = `${urlBase}/${encodedPrompt}?${queryParams.toString()}`;
    console.log("Fetching image from:", url);

    // Show spinner while image loading
    setImageContent(<div className="spinner"></div>);
    
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API}`
            }
        });

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
        setImageContent(
            <div style={{ textAlign: "center" }}>
                <img 
                    src="build-shark-error.png" 
                    alt="Build-A-Shark error fallback with messy whale shark" 
                    loading="lazy" 
                    style={{ marginBottom: "0.7rem" }} 
                />
                <p>Oops, it looks like something went wrong... try submitting again!</p>
            </div>
        );
    }
}
    
    
const apiImageParams = {
    "width": 1080,
    "height": 720,
    "private": "true",
    "nologo": "true",
    "safe": "true"
};

const urlBase = `https://image.pollinations.ai/prompt`;


export async function fetchImageLLM(prompt, params = {}, updateImageContent) {
    // Assemble query params & corresponding URL
    const queryParams = new URLSearchParams({ ...apiImageParams, ...params });
    const encodedPrompt = encodeURIComponent(prompt);

    const url = `${urlBase}/${encodedPrompt}?${queryParams.toString()}`;
    console.log("Fetching image from:", url);

    // Show spinner while image loading
    updateImageContent(<div className="spinner"></div>);
    
    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(
                `HTTP error! status: ${response.status}, message: ${errorText}`
            );
        }

        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        
        // Set up HTML for image display, then update state with image
        const img = new Image();
        img.src = imageUrl;
        img.alt = prompt;
        img.loading = "lazy";
        
        updateImageContent(<img src={imageUrl} alt={prompt} loading="lazy" />);

    // Update image container on error
    } catch (error) {
        console.error("Error fetching image:", error);
        updateImageContent(<p>Error loading image.. try submitting again!</p>);
    }
}
    
    
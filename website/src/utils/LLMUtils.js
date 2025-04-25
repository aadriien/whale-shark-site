const apiImageParams = {
    "width": 1280,
    "height": 720,
    "private": "true",
    "nologo": "true",
    "safe": "true"
};

const urlBase = `https://image.pollinations.ai/prompt`;



export async function fetchImageLLM(prompt, params = {}) {
    // Assemble query params & corresponding URL
    const queryParams = new URLSearchParams({ ...apiImageParams, ...params });
    const encodedPrompt = encodeURIComponent(prompt);

    const url = `${urlBase}/${encodedPrompt}?${queryParams.toString()}`;
    console.log("Fetching image from:", url);
    
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
        
        // Set up HTML structure for image display
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = prompt;
        
        const container = document.getElementById("generated-image-container");
        container.innerHTML = ""; 
        container.appendChild(img);
        
        console.log("Image fetched and displayed.");

    } 
    catch (error) {
        console.error("Error fetching image:", error);
    }
}
    
    
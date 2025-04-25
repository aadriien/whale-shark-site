const apiImageParams = {
    "width": 1080,
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

    // Show spinner while image loading
    const container = document.getElementById("generated-image-container");
    container.innerHTML = `<div class="spinner"></div>`;
    
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
        img.loading = "lazy";
        
        container.innerHTML = ""; 
        container.appendChild(img);

    // Fill image container on error
    } catch (error) {
        console.error("Error fetching image:", error);
        container.innerHTML = `<p>Error loading image.. try submitting again!</p>`;
    }
}
    
    
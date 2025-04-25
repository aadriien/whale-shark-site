export async function fetchImage(prompt, params = {}) {
    const defaultParams = {
        // width: 1024, height: 1024 // Defaults are handled by API
    };
    const queryParams = new URLSearchParams({ ...defaultParams, ...params });
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?${queryParams.toString()}`;
    
    console.log("Fetching image from:", url);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text(); // Get error details if possible
            throw new Error(
                `HTTP error! status: ${response.status}, message: ${errorText}`
            );
        }
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        
        // Example: Display the image
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = prompt;
        
        const container = document.getElementById("generated-image-container");
        container.innerHTML = ""; // Replace any existing image
        container.appendChild(img);
        
        console.log("Image fetched and displayed.");
    } catch (error) {
        console.error("Error fetching image:", error);
    }
}
    
    
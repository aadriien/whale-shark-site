import React, { useState } from "react";

import { fetchImageLLM } from "../utils/LLMUtils.js";

const SharkGenerator = () => {
    const [formData, setFormData] = useState({
        name: "",
        nickname: "",
        age: "",
        country: "",
        destinationCountry: "",
        researcherPOV: ""
    });
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    
    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Highlight key traits from user inputs to infuse personality
        const nbsp = "\u00A0";
        const imagePrompt = `
            Whimsical cartoon of ${formData.name}, a filter-feeding whale shark.${nbsp}
            It's a gentle giant with a huge flat mouth and soft, speckled skin with white dots.${nbsp}
            ${formData.name}, who goes by the nickname ${formData.nickname},${nbsp}
            is a playful, fun, and curious ${formData.age} year old whale shark.${nbsp}
            ${formData.name} (AKA ${formData.nickname}) lives in quirky ${formData.country},${nbsp}
            but has big dreams of visiting ${formData.destinationCountry}!${nbsp}
            If a researcher described this whale shark, they would say '${formData.researcherPOV}'.${nbsp}
            Make the whimsical cartoon highly unique, expressive, and full of charm.${nbsp}
            Add accessories based on how researchers describe ${formData.nickname}'s personality!${nbsp}
            And get *CREATIVE*! Make it zesty. Make it interesting. Add background detail.${nbsp}
            Do *NOT* include any text or letters in the image.\n
        `

        console.log("User form data:", formData);
        console.log("Prompt sent to LLM:", imagePrompt);

        // Harness random each time (0 - 99999) to make images unique
        const seed = Math.floor(Math.random() * 1000000);
        fetchImageLLM(imagePrompt, {seed: seed});
    };
    
    return (
        <div className="shark-generator">
            <form className="shark-generator-form" onSubmit={handleFormSubmit}>

                <label>
                    What's your name?
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </label>

                <br />

                <label>
                    Do you have a nickname?
                    <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                    />
                </label>

                <br />

                <label>
                    How old are you?
                    <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                    />
                </label>

                <br />
                
                <label>
                    What country do you live in?
                    <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                    >
                        <option value="">Select a country</option>
                        <option value="USA">USA</option>
                        <option value="Canada">Canada</option>
                        <option value="UK">UK</option>
                    </select>
                </label>

                <br />

                <label>
                    Which country would you like to visit?
                    <select
                        name="destinationCountry"
                        value={formData.destinationCountry}
                        onChange={handleChange}
                    >
                        <option value="">Select a country</option>
                        <option value="USA">USA</option>
                        <option value="Canada">Canada</option>
                        <option value="UK">UK</option>
                    </select>
                </label>

                <br />

                <label>
                    What would a researcher studying humans say about you?
                    <input
                        type="text"
                        name="researcherPOV"
                        value={formData.researcherPOV}
                        onChange={handleChange}
                    />
                </label>

                <br />
                
                <button type="submit">Submit</button>

            </form>

            <div id="generated-image-container"></div>

        </div>
    );
};

export default SharkGenerator;
    

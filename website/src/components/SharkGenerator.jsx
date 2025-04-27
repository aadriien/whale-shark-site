import React, { useState, useEffect } from "react";

import { getNames } from "country-list";

import { fetchImageLLM } from "../utils/LLMUtils.js";

// Populate list of all countries from "country-list" npm package
const countries = getNames();

const SharkGenerator = () => {
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        country: "",
        researcherPOV: ""
    });

    const [formSubmitted, setFormSubmitted] = useState(false);

    useEffect(() => {
        // Disable reload warning when component is mounted (refreshing page)
        window.onbeforeunload = function () {
            return null;
        };
        return () => {
            window.onbeforeunload = null;
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e) => {
        // Ensure form submission doesn't wipe inputs on page reload
        e.preventDefault();
        setFormSubmitted(true);

        // Highlight key traits from user inputs to infuse personality
        const nbsp = "\u00A0";
        const imagePrompt = `
            Whimsical cartoon of ${formData.name}, a filter-feeding whale shark.${nbsp}
            It's a gentle giant with a huge flat mouth and soft, speckled skin with white dots.${nbsp}
            ${formData.name} is a playful, fun, quirky, and curious whale shark.${nbsp}
            ${formData.name} is ${formData.age} years old and lives in ${formData.country}!${nbsp}
            If a researcher described this whale shark, they would say '${formData.researcherPOV}'.${nbsp}
            Make the whimsical cartoon highly unique, expressive, and full of charm.${nbsp}
            Add accessories based on how researchers describe ${formData.name}'s personality!${nbsp}
            And get *CREATIVE*! Make it zesty. Make it interesting. Add background detail.${nbsp}
            Maybe even add details for ${formData.name}'s country, ${formData.country}!${nbsp}
            Do *NOT* include any text or letters in the image.\n
        `

        console.log("User form data:", formData);
        console.log("Prompt sent to LLM:", imagePrompt);

        // Harness random each time (0 - 99999) to make images unique
        const seed = Math.floor(Math.random() * 1000000);
        fetchImageLLM(imagePrompt, { seed: seed });
    };

    // Clear form data & reset status after submission
    const handleReset = () => {
        setFormData({
            name: "",
            age: "",
            country: "",
            researcherPOV: ""
        });
        setFormSubmitted(false); // Reset submission status
    };

    return (
        <div className="shark-generator">
            <form className="shark-generator-form" onSubmit={handleFormSubmit}>

                <label>
                    <div className="label-text">
                        What's your name?
                        <div className="label-subtext">Or your nickname?</div>
                    </div>
                    <input disabled={formSubmitted}
                        type="text"
                        name="name"
                        value={formData.name}
                        placeholder="e.g. Sharky McSharkface"
                        onChange={handleChange}
                    />
                </label>

                <label>
                    <div className="label-text">
                        How old are you?
                        <span className="label-subtext">(Don't worry, everyone's whale-come here!)</span>
                    </div>
                    <input disabled={formSubmitted}
                        type="number"
                        name="age"
                        value={formData.age}
                        placeholder="e.g. 132"
                        onChange={handleChange}
                    />
                </label>
                
                <label>
                    <div className="label-text">
                        What's your home country? 
                        <span className="label-subtext">Or, which country would you like to visit?</span>
                    </div>
                    <input disabled={formSubmitted}
                        type="text"
                        name="country"
                        list="country-options"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="e.g. Australia"
                    />
                    <datalist id="country-options">
                        {countries.map((country) => (
                            <option key={country} value={country} />
                        ))}
                    </datalist>
                </label>

                <label>
                    <div className="label-text">
                        What would a researcher studying humans say about you?
                        <span className="label-subtext"></span>
                    </div>
                    <input disabled={formSubmitted}
                        type="text"
                        name="researcherPOV"
                        value={formData.researcherPOV}
                        placeholder="e.g. always wears a weird hat"
                        onChange={handleChange}
                    />
                </label>

                <div className="button-container">
                    {/* Reset all inputs button */}
                    <button type="button" onClick={handleReset}>
                        Reset
                    </button>

                    {/* Submit inputs button */}
                    <button type="submit">
                        Submit
                    </button>
                </div>

            </form>

            <div id="generated-image-container"></div>

        </div>
    );
};

export default SharkGenerator;

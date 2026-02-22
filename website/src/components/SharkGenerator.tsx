import { useState, useEffect } from "react";
import { getNames } from "country-list";

import { fetchImageLLM } from "../utils/LLMUtils";


type FormData = {
    name: string;
    age: string;
    country: string;
    researcherPOV: string;
};


// Populate list of all countries from "country-list" npm package
const countries: string[] = getNames();

const MAX_INPUT_LENGTH = {
    name: 50,
    age: 3,
    country: 80,
    researcherPOV: 150
};

const sanitizeInput = (input: string): string => {
    // Remove any HTML tags
    const temp = document.createElement("div");
    temp.textContent = input;
    return temp.textContent || "";
};

const isValidForm = (data: FormData) => {
    // Only validate non-empty fields
    if (data.age.trim()) {
        const ageNum = Number(data.age);
        if (isNaN(ageNum) || ageNum <= 0 || ageNum > 200) return false;
    }
    if (data.country.trim() && !countries.includes(data.country.trim())) return false;

    const textRegex = /^[\p{L}0-9 .,!?'\-()]*$/u;
    if (data.name.trim() && !textRegex.test(data.name.trim())) return false;
    if (data.researcherPOV.trim() && !textRegex.test(data.researcherPOV.trim())) return false;

    return true;
};
 
const SharkGenerator = () => {
    // State to hold image content (or placeholder text)
    const [imageContent, setImageContent] = useState<React.ReactElement | null>(null); 

    const defaultText = (
        <p id="default-text">
            🐋 Build-A-Whale-Shark 🦈
            <br />
            <em>your creation will appear here</em>
        </p>
    );

    const [formData, setFormData] = useState<FormData>({
        name: "",
        age: "",
        country: "",
        researcherPOV: ""
    });

    const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

    useEffect(() => {
        // Disable reload warning when component is mounted (refreshing page)
        window.onbeforeunload = function () {
            return null;
        };
        return () => {
            window.onbeforeunload = null;
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        const sanitizedValue = sanitizeInput(value);
        const maxLength = MAX_INPUT_LENGTH[name as keyof FormData] || 100;
        const truncatedValue = sanitizedValue.slice(0, maxLength);

        setFormData((prev) => ({ ...prev, [name]: truncatedValue }));
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        // Ensure form submission doesn't wipe inputs on page reload
        e.preventDefault();
        setFormSubmitted(true);

        if (!isValidForm(formData)) {
            alert("Please enter valid information.");
            return;
        }

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
        fetchImageLLM({imagePrompt, params: { seed: seed }, setImageContent});
    };

    // Clear form data & reset status after submission
    const handleReset = () => {
        setFormData({
            name: "",
            age: "",
            country: "",
            researcherPOV: ""
        });

        // Reset submission status & image container
        setFormSubmitted(false); 
        setImageContent(null);
    };

    return (
        <div className="shark-generator">
            <form className="shark-generator-form" onSubmit={handleFormSubmit}>

                <label>
                    <div className="label-text">
                        What's your name?
                        <div className="label-subtext">
                            Or your nickname?
                        </div>
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
                        <div className="label-subtext">
                            (Don't worry, everyone's whale-come here!)
                        </div>
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
                        <div className="label-subtext">
                            Or, which country would you like to visit?
                        </div>
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
                        <div className="label-subtext"></div>
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

            <div id="generated-image-container">
                {/* Conditionally render imageContent or defaultText */}
                {imageContent || defaultText}
            </div>

        </div>
    );
};

export default SharkGenerator;


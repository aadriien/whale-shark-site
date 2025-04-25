import React, { useState } from 'react';

import { fetchImage } from "../utils/LLMUtils.js";

const SharkGenerator = () => {
    const [formData, setFormData] = useState({
        name: '',
        country: '',
    });
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    
    const handleFormSubmit = (e) => {
        e.preventDefault();
        console.log('User form data:', formData);
        
        fetchImage("A beautiful sunset over the ocean", {
            width: 1280,
            height: 720,
            seed: 42,
            model: "flux",
            // nologo: true // Optional
        });
    };
    
    return (
        <>
            <form onSubmit={handleFormSubmit}>

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
                
                <button type="submit">Submit</button>

            </form>
            
            <div id="generated-image-container" style={{ marginTop: "20px" }}></div>
        </>
    );
};

export default SharkGenerator;
    

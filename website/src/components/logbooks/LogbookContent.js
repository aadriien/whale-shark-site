export const pageMap = {
    home: { label: "Home", path: "/" },
    about: { label: "About", path: "/about" },

    research: { label: "Research Reef", path: "/research" },
    creative: { label: "Creative Current", path: "/creative" },
    
    globeviews: { label: "Globe Views", path: "/research/globeviews" },
    sharktracker: { label: "Shark Tracker", path: "/research/sharktracker" },
    geolabs: { label: "Geo Labs", path: "/research/geolabs" },
    datavisuals: { label: "Data Visuals", path: "/research/datavisuals" },
    environment: { label: "Environment", path: "/research/environment" },
    sharkvision: { label: "Shark Vision", path: "/research/sharkvision" },

    buildashark: { label: "Build-A-Shark", path: "/creative/buildashark" },
    animation: { label: "Animation", path: "/creative/animation" },
};


export const pageContent = {
    home: {
        overview: "This is your entry point into the whale shark site. Interact with the particle blobs and start exploring!",
        faqs: [
            { 
                q: "What are the those pink and green dots?", 
                a: "Those are the particle blobs! They will lead you to the Research Reef and Creative Current zones." 
            },
            { 
                q: "Where do I go next?", 
                a: "That's for you to decide! Click on one of the dotted blobs to begin your journey." 
            }
        ]
    },
    about: {
        overview: "This is an overview of whale sharks! Learn what they are and why they are important.",
        faqs: [
            { 
                q: "So are they whales or are they sharks?", 
                a: "They are sharks! The name whale shark comes from the fact that these fish are very large, like whales!" 
            },
            { 
                q: "Can you really find whale sharks anywhere?", 
                a: "Very nearly! They thrive in warm waters around the globe and can be spotted in many regions close to the equator." 
            }
        ]
    },

    research: {
        overview: "This is your entry point into the research side of the site. Dive into the data and see real whale sharks!",
        faqs: [
            { 
                q: "Where are these data coming from?", 
                a: "The whale shark records come from GBIF, while the ocean data comes largely from Copernicus Marine." 
            },
            { 
                q: "How granular are the data and who is the intended audience?", 
                a: "The Research Reef is meant to showcase more detailed real-world data, for the sake of discovery and curiosity. It is not designed for academic studies." 
            }
        ]
    },
    creative: {
        overview: "This is your entry point into the creative side of the site. Play with the interactives and have fun!",
        faqs: [
            { 
                q: "Will I find real whale sharks here?", 
                a: "No. The Creative Current is meant to be a playground for shark-themed fun." 
            },
            { 
                q: "What is the purpose of this part of the site?", 
                a: "This is a place to have fun and build something silly. Lean into the whimsy!" 
            }
        ]
    },

    globeviews: {
        overview: "This is a view of whale shark sightings around the world! Move the globe and toy with filters to get started.",
        faqs: [
            { 
                q: "Why do only some whale sharks have real images?", 
                a: "Real data can be messy, and sometimes photos are not possible! Much of the data comes from satellite tracking, but satellites cannot take pictures underwater." 
            },
            { 
                q: "Why are some of the ripple dots on top of land masses?", 
                a: "Sometimes there is human error in data. This can happen when researchers and divers input the wrong coordinates." 
            }
        ]
    },
    sharktracker: {
        overview: "This is a storytelling experience where you can see the real movements over time of specific whale sharks!",
        faqs: [
            { 
                q: "Why are there cartoon images and funny names?", 
                a: "None of these sharks have real-world images, since their data comes from satellite tracking. The cartoons and names are there to give them personality!" 
            },
            { 
                q: "Why are there only a handful of whale sharks here?", 
                a: "These sharks have been highlighted because they have interesting and varied data. It can be difficult to find whale sharks with multiple records and known information." 
            }
        ]
    },
    geolabs: {
        overview: "This is an interactive page that allows you to explore your favorite whale sharks in greater depth.",
        faqs: [
            { 
                q: "What is the difference between single and multi shark view?", 
                a: "The single viewer shows one shark in detail, with a story stepping feature. The multi viewer allows you to engage with many sharks, offering a timeline slider for the globe." 
            },
            { 
                q: "Why am I not seeing much, and how many sharks do I need?", 
                a: "To use this page, you must first save whale sharks via the gold star. You can then add as many of them to the lab as you want!" 
            }
        ]
    },
    datavisuals: {
        overview: "This is a series of data blocks reflecting trends over time and space.",
        faqs: [
            { 
                q: "Why are there so many unknowns with sex and life stage?", 
                a: "Often times, researchers and divers just cannot be sure! There are gaps in the data which may or may not be filled due to real-world limitations." 
            },
            { 
                q: "What are some meaningful comparisons to make?", 
                a: "That is your call! If you need help getting started, try selecting a recent year, or a country that interests you!" 
            }
        ]
    },
    environment: {
        overview: "This is a glimpse into ocean conditions over time, powered by Copernicus Marine.",
        faqs: [
            { 
                q: "Where are the whale sharks?", 
                a: "They have not been incorporated yet! This site is a work in progress, so stay tuned for more!" 
            },
            { 
                q: "Which metrics could be interesting to explore?", 
                a: "For whale sharks, chlorophyll-a and temperature offer a lot of insight!" 
            }
        ]
    },
    sharkvision: {
        overview: "This is a technological overview of computer vision, a field of AI. Learn how it can help us study whale sharks!",
        faqs: [
            { 
                q: "How can the computer vision model see the shark?", 
                a: "One of the models has been fine-tuned to detect the rough shape of a whale shark. It learned this by studying real data. " 
            },
            { 
                q: "How do we know if the model is right?", 
                a: "This is difficult to determine, and there is so much that goes into it! A series of checks aim to validate the results, but we cannot be fully certain." 
            }
        ]
    },

    buildashark: {
        overview: "This is your place to get creative and make a silly cartoon shark!",
        faqs: [
            { 
                q: "Why does this exist?", 
                a: "This approach was first used in Shark Tracker, to give the real whale shark profiles more personality. Now you can have fun with it!" 
            },
            { 
                q: "How does it work and why does my shark look like that?", 
                a: "This tool uses generative AI to create a new whale shark cartoon from your inputs. Try adjusting what you have written to observe the effect!" 
            }
        ]
    },
    animation: {
        overview: "This is a sandbox for creating your own custom swimming path for a 3D model of a whale shark.",
        faqs: [
            { 
                q: "How do I interact with the objects on this page?", 
                a: "Click and drag the spheres to move them around. Add new ones into the path, or otherwise delete existing ones. When you are ready, the shark will swim along the path you built!" 
            },
            { 
                q: "Is there something familiar about this whale shark?", 
                a: "Yes! This is the very same 3D model that you can see in the home page, just without the points extracted for a glowing dot effect." 
            }
        ]
    },
};



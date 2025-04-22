import storySharkOptions from "../assets/data/gbif_story_sharks_named.json";


const sharksOfInterest = [
    "101373b", // total: 5 --> Male Adult --> Belize (2011), Guatemala (2011), Honduras (2011), Trinidad and Tobago (2011)
    "101376a", // total: 11 --> Male Adult --> Colombia (2011), Cuba (2010), Mexico (2010), Mexico (year Unknown), Nicaragua (2011), United States (2010)
    "57829", // total: 12 --> Male Adult --> Australia (2019), Australia (year Unknown), Indonesia (2018)
    "101373a", // total: 21 --> Male Adult --> Bahamas (2010), Canada (2010), Cuba (2010), Mexico (2010), Mexico (year Unknown), United States (2010), United States (year Unknown)
    "Ranger", // total: 25 --> Unknown Unknown --> Ecuador (2011), Ecuador (2015), Peru (2016)
    "101371a", // total: 28 --> Female Juvenile --> Bahamas (2010), Bahamas (2011), Cuba (2010), Mexico (2010), Mexico (year Unknown), United States (2010), United States (2011), United States (year Unknown)
    "57828", // total: 29 --> Male Subadult --> Australia (2018), Australia (year Unknown), Indonesia (2018), Indonesia (year Unknown)
    "112470", // total: 31 --> Male Subadult --> Mexico (2013), Mexico (year Unknown), United States (2013), United States (year Unknown)
    "57821", // total: 35 --> Female Subadult --> Australia (year Unknown), Christmas Island (2018), Cocos (Keeling) Islands (2018)
    "George", // total: 106 --> Unknown Unknown --> Colombia (2015), Ecuador (2015), Ecuador (2016)
]

const selectedSharkIDs = [
    "101376a",
    "101373a",
    "Ranger",
    "101371a",
    "57828",
    "57821",
]

const keyMap = {
    "whaleSharkID": "id",
    "LLM-Gen Name (openai API)": "name",
    "LLM-Gen Name (gemma:2b local)": "gemmaName",
    "Total Occurrences": "occurrences",
    "Oldest Occurrence": "oldest",
    "Newest Occurrence": "newest",
    "HUMAN_OBSERVATION": "human",
    "MACHINE_OBSERVATION": "machine",
    "lifeStage (year)": "lifeStage",
    "country (year)": "countries",
    "stateProvince - verbatimLocality (month year)": "regions",
};


const storySharksRaw = storySharkOptions.filter(
    shark => selectedSharkIDs.includes(shark.whaleSharkID)
);

export const storySharks = storySharksRaw.map(obj => formatKeyVals(obj, keyMap));


function cleanLifestage(obj) {
    const rawLifeStage = obj.lifeStage;
  
    const cleanedLifeStage =
        rawLifeStage
            ?.split(",")
            .map(stage => stage.trim())
            .find(stage => !stage.toLowerCase().startsWith("unknown"))
            ?.replace(/\s*\(\d{4}\)/, "") || "Unknown";
  
    return cleanedLifeStage;
}


function formatKeyVals(obj, keyMap) {
    // Adjust column names for easier access in shark card
    const renamed = Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [keyMap[key] || key, value])
    );

    // Extract just 1 lifeStage where available
    if (renamed.lifeStage) {
        renamed.lifeStage = cleanLifestage(renamed);
    }

    return renamed;
}





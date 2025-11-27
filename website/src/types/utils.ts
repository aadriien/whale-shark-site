/* Util types */

export type FetchImageLLMProps = { 
    imagePrompt: string; 
    params: Record<string, any>; 
    setImageContent: React.Dispatch<React.SetStateAction<React.ReactElement | null>>;
};


export type LightDarkTheme = "light" | "dark";

export type LightDarkToggleProps = {
    theme: LightDarkTheme;
    setTheme: React.Dispatch<React.SetStateAction<LightDarkTheme>>;
}



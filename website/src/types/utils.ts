/* Util types */

export type FetchImageLLMProps = { 
    imagePrompt: string; 
    params: Record<string, any>; 
    setImageContent: React.Dispatch<React.SetStateAction<React.ReactElement | null>>;
};



import React from "react";

/* Util types */

export type FetchImageLLMProps = {
    imagePrompt: string;
    params: Record<string, string>;
    setImageContent: React.Dispatch<React.SetStateAction<React.ReactElement | null>>;
};

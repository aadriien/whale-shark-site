/* Page-adjacent types */

export type LightDarkTheme = "light" | "dark";

export type LightDarkToggleProps = {
    theme: LightDarkTheme;
    setTheme: React.Dispatch<React.SetStateAction<LightDarkTheme>>;
}


export type NavbarProps = {
    isLogbookOpen: boolean;
    setIsLogbookOpen: React.Dispatch<React.SetStateAction<boolean>>;
    theme: LightDarkTheme;
    setTheme: React.Dispatch<React.SetStateAction<LightDarkTheme>>;
}


export type PageMetadata = {
    path: string;
    title: string;
    description: string;
    image: string;
}



/* Node.js country-list types */

declare module "country-list" {
    export function getCode(countryName: string): string | undefined;
    export function getName(countryCode: string): string | undefined;
    export function getNames(): string[];
    export function getCodes(): string[];
    export function getData(): { code: string; name: string }[];
}



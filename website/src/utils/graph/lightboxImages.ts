import { visionOccurrences, mediaSharks, parseImageField } from "../DataUtils";
import { ImageMetadata } from "../../types/sharks";

export type OccurrenceImage = ImageMetadata & { imageId: number };

// visionOccurrences (graph's image nodes) don't carry creator / license,
// so cross-reference URL with data from mediaSharks
function getSharkImageCreditByUrl(sharkId: string): Map<string, ImageMetadata> {
    const shark = mediaSharks.find((s) => s.id === sharkId);
    if (!shark || !shark.image || shark.image === "Unknown") return new Map();

    return new Map(parseImageField(shark.image).map((img) => [img.url, img]));
}

export function getSharkOccurrenceImages(sharkId: string): OccurrenceImage[] {
    const creditByUrl = getSharkImageCreditByUrl(sharkId);

    return visionOccurrences
        .filter((occ) => occ.id === sharkId && occ.image_id != null && occ.identifier_url)
        .map((occ) => {
            const url = occ.identifier_url as string;
            const credit = creditByUrl.get(url);
            return {
                imageId: occ.image_id as number,
                url,
                creator: credit?.creator,
                license: credit?.license,
            };
        });
}

// Index of the occurrence matching a given image ID
export function activeOccurrenceIndex(images: OccurrenceImage[], imageId?: number | null): number {
    if (imageId == null) return 0;
    const idx = images.findIndex((img) => img.imageId === imageId);
    return idx === -1 ? 0 : idx;
}
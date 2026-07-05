import { visionOccurrences } from "../DataUtils";
import { LightboxImage } from "../../types/graphs";

export type OccurrenceImage = LightboxImage & { imageId: number };

export function getSharkOccurrenceImages(sharkId: string): OccurrenceImage[] {
    return visionOccurrences
        .filter((occ) => occ.id === sharkId && occ.image_id != null && occ.identifier_url)
        .map((occ) => ({
            imageId: occ.image_id as number,
            url: occ.identifier_url as string,
        }));
}

// Index of the occurrence matching a given image ID
export function activeOccurrenceIndex(images: OccurrenceImage[], imageId?: number | null): number {
    if (imageId == null) return 0;
    const idx = images.findIndex((img) => img.imageId === imageId);
    return idx === -1 ? 0 : idx;
}
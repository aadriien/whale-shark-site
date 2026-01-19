import { 
    cleanLifestage, 
    parseSpecificRegion, 
    parseRemarks, 
} from "./DataUtils";

import { WhaleSharkDatasetNormalized } from "../types/sharks";
import { SharkCriteria } from "../types/filters";


// Helper to extract all regional options for filter (e.g. country, publishingCountry)
export function extractUniqueSortedRegions(
    sharks: WhaleSharkDatasetNormalized, 
    fieldSelector: string
) {
    return Array.from(
        new Set(
            sharks.flatMap(shark => {
                const value = shark[fieldSelector] as string | undefined;

                return (
                    value
                        ?.split(",")
                        .map(c => parseSpecificRegion(c).trim())
                        .filter(Boolean)
                    ) ?? [];
            })
        )
    ).sort((a, b) => a.localeCompare(b));
}


// Pure function that applies all filters to sharks array
export function filterSharks(
    sharks: WhaleSharkDatasetNormalized, 
    filters: SharkCriteria
) {
    return sharks.filter((shark) => {
        // ---------- MEDIA PRESENCE ----------
        if (filters.showOnlyWithMedia) {
            const hasMedia = (
                shark.image && 
                shark.image.trim() !== "" && 
                shark.image !== "Unknown"
            );
            if (!hasMedia) return false;
        }

        // ---------- LOCATION ----------
        if (filters.country) {
            const countries = (shark.countries || "")
                .split(",")
                .map(c => parseSpecificRegion(c).toLowerCase().trim());

            const match = countries.some(
                c => c.includes(
                    filters.country.toLowerCase()
                )
            );
            if (!match) return false;
        }

        if (filters.publishingCountry) {
            const publishingCountries = (shark.publishing || "")
                .split(",")
                .map(c => parseSpecificRegion(c).toLowerCase().trim());

            const match = publishingCountries.some(
                c => c.includes(
                    filters.publishingCountry.toLowerCase()
                )
            );
            if (!match) return false;
        }

        // ---------- TIME RANGE ----------
        if (filters.yearRange) {
            const yearMin = parseInt(shark.oldest);
            const yearMax = parseInt(shark.newest);
            const filterMin = parseInt(filters.yearRange[0]);
            const filterMax = parseInt(filters.yearRange[1]);

            if (
                isNaN(yearMin) || isNaN(yearMax) ||
                yearMax < filterMin ||
                yearMin > filterMax
            ) {
                return false;
            }
        }

        if (filters.month) {
            const match = shark.months.some(
                c => c.includes(
                    filters.month
                )
            );
            if (!match) return false;
        }

        // ---------- METADATA ----------
        if (filters.hasOccurrenceNotes) {
            const remarks = parseRemarks(shark.remarks);
            if (remarks === "None") return false;
        }

        if (filters.minRecords > 0 && shark.occurrences < filters.minRecords) {
            return false;
        }

        // ---------- TAXONOMIC & BIO ----------
        if (filters.sex) {
            const sex = shark.sex?.toLowerCase() || "";
            if (sex !== filters.sex.toLowerCase()) return false;
        }

        if (filters.lifeStage) {
            const stage = cleanLifestage(shark).toLowerCase();
            if (stage !== filters.lifeStage.toLowerCase()) return false;
        }

        if (filters.observationType) {
            let hasType = true;
            if (filters.observationType == "Satellite") {
                hasType = shark.machine > 0 ? true : false;
            }
            else if (filters.observationType == "Human") {
                hasType = shark.human > 0 ? true : false;
            }
            if (!hasType) return false;
        }

        // PASSES ALL FILTERS
        return true;
    });
}


// Filter function for computer vision shark matching 
export function filterVisionSharks(
    sharks: WhaleSharkDatasetNormalized, 
    filters: SharkCriteria
) {
    // First apply standard shark filters, then CV filters
    const filteredBySharkCriteria = filterSharks(sharks, filters);

    return filteredBySharkCriteria.filter((shark) => {
        // ---------- MATCH QUALITY ----------
        if (filters.miewidDistanceRange) {
            const distance = shark.miewid_match_distance;
            if (!distance || isNaN(distance)) return false;

            const [minDist, maxDist] = filters.miewidDistanceRange;
            if (distance < minDist || distance > maxDist) return false;
        }

        if (filters.showOnlyConfidentMatches) {
            const distance = shark.miewid_match_distance;
            if (!distance || isNaN(distance) || distance >= 1.0) {
                return false;
            }
        }

        if (filters.plausibility) {
            if (shark.plausibility !== filters.plausibility) {
                return false;
            }
        }

        // ---------- MATCHED IMAGES ----------
        if (filters.hasMatchedImages) {
            const matchedSharkId = shark.matched_shark_id;
            
            if (matchedSharkId) {
                const hasImages = sharks.some(
                    matchedSharkImg => matchedSharkImg.id === matchedSharkId
                );
                if (!hasImages) return false;
            }
        }

        // PASSES ALL FILTERS
        return true;
    });
}


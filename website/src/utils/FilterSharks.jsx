import { 
    cleanLifestage, 
    parseSpecificRegion, 
    parseRemarks, 
} from "./DataUtils";


// Helper to extract all regional options for filter (e.g. country, publishingCountry)
export function extractUniqueSortedRegions(items, key) {
    return Array.from(
        new Set(
            items.flatMap(item =>
                item[key]
                    ?.split(",")
                    .map(c => parseSpecificRegion(c).trim())
                    .filter(Boolean) || []
            )
        )
    ).sort((a, b) => a.localeCompare(b));
}


// Pure function that applies all filters to sharks array
export function filterSharks(sharks, filters) {
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


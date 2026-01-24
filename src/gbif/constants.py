###############################################################################
##  `constants.py`                                                           ##
##                                                                           ##
##  Purpose: Store all file path constants for GBIF data processing          ##
###############################################################################


# Raw data files
GBIF_RAW_CSV = "data/gbif_raw.csv"

# Cleaned data files
GBIF_CLEAN_CSV = "data/gbif_clean.csv"
GBIF_MEDIA_CSV = "data/gbif_media.csv"

# Analysis output files
GBIF_CALENDAR_STATS_CSV = "outputs/gbif_calendar_stats.csv"
GBIF_COUNTRY_STATS_CSV = "outputs/gbif_country_stats.csv"
GBIF_CONTINENT_STATS_CSV = "outputs/gbif_continent_stats.csv"
GBIF_PUBLISHING_COUNTRY_STATS_CSV = "outputs/gbif_publishingCountry_stats.csv"

# Individual shark tracking files
GBIF_INDIVIDUAL_SHARKS_STATS_CSV = "outputs/gbif_individual_sharks_stats.csv"

# JSON files for website (Three.js globe display)
GBIF_SHARK_TRACKING_JSON = "website/src/assets/data/json/gbif_shark_tracking.json"

# Story sharks (frequently sighted sharks)
GBIF_STORY_SHARKS_CSV = "outputs/gbif_story_sharks.csv"
GBIF_STORY_SHARK_TRACKING_JSON = "website/src/assets/data/json/gbif_story_shark_tracking.json"

# GeoJSON files for Copernicus Marine data layer integration
GBIF_SHARK_TRACKING_MULTI_GEOJSON = "website/src/assets/data/json/gbif_shark_tracking_multipoint_geojson.json"
GBIF_SHARK_TRACKING_LINE_GEOJSON = "website/src/assets/data/json/gbif_shark_tracking_linestring_geojson.json"

# Media sharks (sharks with available images)
GBIF_MEDIA_SHARKS_CSV = "outputs/gbif_media_sharks.csv"
GBIF_MEDIA_SHARK_TRACKING_JSON = "website/src/assets/data/json/gbif_media_shark_tracking.json"



###############################################################################
##  `geomap_utils.py`                                                        ##
##                                                                           ##
##  Purpose: Processes lat/lon coordinates for geomapped data                ##
###############################################################################


import geopandas as gpd
from shapely.geometry import Point

LME_SHAPEFILE = "data/lme66/lme66.shp"


# Load all possible LMEs (Large Marine Ecosystems) just ONCE from shapefile
lme_gdf = gpd.read_file(LME_SHAPEFILE)


def get_LME_from_coords(lat: float, lon: float) -> str:
    # Create a point geometry & find LME that contains it
    point = Point(lon, lat) 
    lme_match = lme_gdf[lme_gdf.contains(point)]

    if not lme_match.empty:
        lme_name = lme_match.iloc[0]["LME_NAME"]
        return lme_name
    else:
        # print(f"Point ({lat},{lon}) is not inside any LME boundary.")
        return "Unknown"



if __name__ == "__main__":
    # Examples to test each LME region
    examples = {
        "Gulf of Mexico": (25.0, -90.0),        # Inside Gulf of Mexico
        "Caribbean Sea": (15.0, -80.0),         # Inside Caribbean Sea
        "Canary Current": (30.0, -15.0),        # Inside Canary Current
        "Guinea Current": (10.0, 0.0),           # Inside Guinea Current
        "Agulhas Current": (-30.0, 25.0),       # Inside Agulhas Current
        "Somali Coastal Current": (5.0, 50.0),  # Inside Somali Coastal Current
        "Red Sea": (20.0, 40.0),                 # Inside Red Sea
        "Arabian Sea": (15.0, 60.0),             # Inside Arabian Sea
        "Bay of Bengal": (15.0, 90.0),           # Inside Bay of Bengal
        "South China Sea": (15.0, 110.0),        # Inside South China Sea
        "East China Sea": (25.0, 125.0),         # Inside East China Sea
        "Coral Triangle": (-1.5, 130.0)           # Inside Coral Triangle
    }

    # for region, (lat, lon) in examples.items():
    #     lme_result = get_LME_from_coords(lat=lat, lon=lon)
    #     print(f"{region}: {lme_result}")




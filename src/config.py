###############################################################################
##  `config.py`                                                              ##
##                                                                           ##
##  Purpose: Holds key reusables & setup items                               ##
###############################################################################


import country_converter as coco
import pycountry_convert as pc


COMMON_NAME = "whale shark"
SPECIES_NAME = "rhincodon typus"

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def convert_ISO_code_to_country(country_code: str) -> str:
    if not isinstance(country_code, str):
        raise ValueError("Error, must specify country_code")

    if country_code in ["ZZ", "XX", None, ""]:
        return "Unknown"

    full_country_name = coco.convert(names=country_code, to="name")
    return full_country_name


def convert_country_to_continent(country_name: str) -> str:
    if not isinstance(country_name, str):
        raise ValueError("Error, must specify country_name")

    try:
        country_alpha2 = pc.country_name_to_country_alpha2(country_name)
        continent_code = pc.country_alpha2_to_continent_code(country_alpha2)
        continent_name = pc.convert_continent_code_to_continent_name(continent_code)
        return continent_name
    except Exception:
        return "Unknown"



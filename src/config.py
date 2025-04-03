###############################################################################
##  `config.py`                                                              ##
##                                                                           ##
##  Purpose: Holds key reusables & setup items                               ##
###############################################################################


import country_converter as coco


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



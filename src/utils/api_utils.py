###############################################################################
##  `api_utils.py`                                                           ##
##                                                                           ##
##  Purpose: Provides helpers for API querying                               ##
###############################################################################


import json 


def prettify_json(data):
    return json.dumps(data, indent=4, separators=(",", ": "))


# Recursively search for a specific field in nested dict or list
def find_field(data, key):
    if isinstance(data, dict):
        if key in data:
            return data[key]
        for curr_key, curr_value in data.items():
            result = find_field(curr_value, key)
            if result is not None:
                return result

    elif isinstance(data, list):
        for item in data:
            result = find_field(item, key)
            if result is not None:
                return result

    return None  # Otherwise key not found



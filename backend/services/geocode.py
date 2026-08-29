"""Server-side reverse geocoding.

Reverse geocoding is performed on the server so that the Google Geocoding API
key never reaches the browser. The result is a dict of address components that
gets stored alongside the original coordinates.
"""
import os

import requests

GOOGLE_KEY = os.getenv("GOOGLE_MAPS_SERVER_KEY", "").strip()
GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
TIMEOUT = 8


def _pick_short(types, components):
    for comp in components:
        if set(types) & set(comp.get("types", [])):
            return comp.get("short_name")
    return None


def _pick_long(types, components):
    for comp in components:
        if set(types) & set(comp.get("types", [])):
            return comp.get("long_name")
    return None


def _first_long(groups, components):
    """Return the long_name for the first type-group that matches any component,
    honoring priority (a city-level type beats a neighborhood-level one)."""
    for group in groups:
        value = _pick_long(group, components)
        if value:
            return value
    return None


def reverse_geocode_google(latitude, longitude):
    """Use Google Geocoding API reverse geocoding.

    Returns a dict of address fields, or None if no key / the request failed.
    Never raises: callers should fall back gracefully.
    """
    if not GOOGLE_KEY:
        return None

    try:
        resp = requests.get(
            GEOCODING_URL,
            params={
                "latlng": f"{latitude},{longitude}",
                "key": GOOGLE_KEY,
                "language": os.getenv("GEOCODE_LANGUAGE", "").strip() or None,
            },
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return None

    results = data.get("results") or []
    if data.get("status") != "OK" or not results:
        return None

    result = results[0]
    components = result.get("address_components") or []

    # Prefer the most specific result type that was actually returned.
    types = result.get("types") or []
    specificity = (
        "ROOFTOP"
        if "ROOFTOP" in types or "STREET_ADDRESS" in types
        else "PREMISE"
        if "PREMISE" in types or "SUBPREMISE" in types
        else "SUBLOCALITY_LEVEL_1"
        if "SUBLOCALITY_LEVEL_1" in types or "SUBLOCALITY_LEVEL_2" in types
        else "LOCALITY"
        if "LOCALITY" in types
        else "ADMINISTRATIVE_AREA_LEVEL_1"
        if any(t.startswith("ADMINISTRATIVE_AREA") for t in types)
        else "COUNTRY"
        if "COUNTRY" in types
        else "OTHER"
    )

    plus_code = result.get("plus_code") or {}
    geometry = result.get("geometry") or {}

    return {
        "formatted_address": result.get("formatted_address"),
        "street_number": _pick_short(["street_number"], components),
        "street": _pick_long(
            ["route", "premise", "subpremise"], components
        ),
        "neighborhood": _pick_long(
            ["neighborhood", "sublocality_level_1", "sublocality_level_2"],
            components,
        ),
        "locality": _first_long(
            [
                ["postal_town"],
                ["locality"],
                ["sublocality"],
                ["sublocality_level_1"],
                ["sublocality_level_2"],
            ],
            components,
        ),
        "district": _pick_long(
            ["administrative_area_level_3", "administrative_area_level_2"],
            components,
        ),
        "state": _pick_long(["administrative_area_level_1"], components),
        "postal_code": _pick_short(["postal_code"], components),
        "country": _pick_long(["country"], components),
        "country_code": _pick_short(["country"], components),
        "place_id": result.get("place_id"),
        "plus_code": plus_code.get("global_code"),
        "geocode_type": specificity,
        "location_type": geometry.get("location_type"),
    }


def resolve_address(latitude, longitude):
    """Top-level helper: try Google, otherwise return a minimal dict.

    Keeps the original coordinates untouched (they are stored separately).
    """
    google = reverse_geocode_google(latitude, longitude)
    if google is not None:
        google["source"] = "google"
        return google

    return {
        "formatted_address": None,
        "street_number": None,
        "street": None,
        "neighborhood": None,
        "locality": None,
        "district": None,
        "state": None,
        "postal_code": None,
        "country": None,
        "country_code": None,
        "place_id": None,
        "plus_code": None,
        "geocode_type": None,
        "location_type": None,
        "source": "unresolved",
    }

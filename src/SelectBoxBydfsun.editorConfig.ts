// @ts-nocheck
export function getProperties(_values, defaultProperties) {
    return defaultProperties;
}

function lastPathSegment(path) {
    if (!path || typeof path !== "string") {
        return "";
    }
    const parts = path.split(".");
    return parts[parts.length - 1] || path;
}

// Used by Studio Pro to render the widget caption in structure mode.
export function getCustomCaption(values) {
    const attr = lastPathSegment(values?.valueAttribute);
    return attr ? attr : "Select Box";
}

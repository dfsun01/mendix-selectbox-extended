// @ts-nocheck
import { createElement } from "react";

function toAttributeCaption(valueAttribute) {
    if (!valueAttribute) {
        return "";
    }
    const parts = valueAttribute.split(".");
    return parts[parts.length - 1] || valueAttribute;
}

export function preview(props) {
    // In Studio Pro "structure" mode, render as a plain input so it looks like a regular form field.
    if (props.renderMode === "structure") {
        const caption = toAttributeCaption(props.valueAttribute);
        const value = caption ? `[${caption}]` : "Select Box";
        return createElement(
            "div",
            { className: "mx-selectbox mx-selectbox--preview mx-selectbox--structure" },
            createElement(
                "div",
                { className: "mx-selectbox__control mx-selectbox__control--structure" },
                createElement("span", { className: "mx-selectbox__value mx-selectbox__value--structure" }, value),
                createElement("span", { className: "mx-selectbox__arrow" })
            )
        );
    }

    const className = "mx-selectbox mx-selectbox--preview";
    return createElement("div", { className }, [
        createElement(
            "div",
            { key: "control", className: "mx-selectbox__control" },
            createElement("span", { className: "mx-selectbox__value is-placeholder" }, props.placeholder || "Select..."),
            createElement("span", { className: "mx-selectbox__arrow" })
        )
    ]);
}

export function getPreviewCss() {
    return require("./ui/SelectBoxBydfsun.css");
}

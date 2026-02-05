import { ReactElement, createElement } from "react";

import { SelectBoxBydfsunPreviewProps } from "../typings/SelectBoxBydfsunProps";

export function preview(props: SelectBoxBydfsunPreviewProps): ReactElement {
    const className = "mx-selectbox mx-selectbox--preview";
    return (
        <div className={className}>
            <div className="mx-selectbox__control">
                <span className="mx-selectbox__value is-placeholder">{props.placeholder || "Select..."}</span>
                <span className="mx-selectbox__arrow" />
            </div>
        </div>
    );
}

export function getPreviewCss(): string {
    return require("./ui/SelectBoxBydfsun.css");
}

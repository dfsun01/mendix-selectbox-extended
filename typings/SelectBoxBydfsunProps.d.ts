/**
 * This file was generated from SelectBoxBydfsun.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue, EditableValue, ListValue, ListAttributeValue } from "mendix";
import { Big } from "big.js";

export type DropdownPlacementEnum = "auto" | "bottom" | "top";

export interface SelectBoxBydfsunContainerProps {
    name: string;
    tabIndex?: number;
    id: string;
    valueAttribute: EditableValue<string>;
    options: ListValue;
    optionLabel: ListAttributeValue<string>;
    optionValue?: ListAttributeValue<string | Big>;
    placeholder?: DynamicValue<string>;
    searchPlaceholder: string;
    delimiter: string;
    showClearButton: boolean;
    showTagDisplay: boolean;
    showTagRemove: boolean;
    dropdownPlacement: DropdownPlacementEnum;
    enableMultiSelect: boolean;
    enableSearch: boolean;
    enableDeduplicate: boolean;
}

export interface SelectBoxBydfsunPreviewProps {
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    valueAttribute: string;
    options: {} | { caption: string } | { type: string } | null;
    optionLabel: string;
    optionValue: string;
    placeholder: string;
    searchPlaceholder: string;
    delimiter: string;
    showClearButton: boolean;
    showTagDisplay: boolean;
    showTagRemove: boolean;
    dropdownPlacement: DropdownPlacementEnum;
    enableMultiSelect: boolean;
    enableSearch: boolean;
    enableDeduplicate: boolean;
}

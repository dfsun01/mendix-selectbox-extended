import { ReactElement, createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DynamicValue, ValueStatus } from "mendix";

import { SelectBoxBydfsunContainerProps } from "../typings/SelectBoxBydfsunProps";
import "./ui/SelectBoxBydfsun.css";

type OptionItem = {
    id: string;
    label: string;
    value: string;
};

function parseDelimited(value: string, delimiter: string): string[] {
    return value
        .split(delimiter)
        .map(item => item.trim())
        .filter(item => item.length > 0);
}

function toDisplayString(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }
    return value.toString();
}

function resolveTextTemplate(value: DynamicValue<string> | string | undefined, fallback: string): string {
    if (!value) {
        return fallback;
    }
    if (typeof value === "string") {
        return value.length > 0 ? value : fallback;
    }
    if (value.status === ValueStatus.Available) {
        const resolved = value.value ?? "";
        return resolved.length > 0 ? resolved : fallback;
    }
    return fallback;
}

export function SelectBoxBydfsun(props: SelectBoxBydfsunContainerProps): ReactElement {
    const {
        valueAttribute,
        options,
        optionLabel,
        optionValue,
        placeholder,
        searchPlaceholder,
        delimiter,
        showClearButton,
        showTagDisplay,
        showTagRemove,
        dropdownPlacement,
        enableMultiSelect,
        enableSearch,
        enableDeduplicate
    } = props;

    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");

    const currentValue = toDisplayString(valueAttribute?.value ?? "");
    const resolvedDelimiter = delimiter && delimiter.length > 0 ? delimiter : ", ";
    const selectedValues = useMemo(
        () => parseDelimited(currentValue, resolvedDelimiter),
        [currentValue, resolvedDelimiter]
    );
    const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

    const isReadOnly = valueAttribute?.readOnly ?? false;
    const placeholderText = resolveTextTemplate(placeholder, "Select...");

    const rawItems = useMemo(() => {
        if (!options || options.status !== ValueStatus.Available || !options.items) {
            return [];
        }
        return options.items;
    }, [options]);

    const mappedOptions = useMemo(() => {
        if (!optionLabel) {
            return [] as OptionItem[];
        }
        const seen = new Set<string>();
        const result: OptionItem[] = [];
        for (const item of rawItems) {
            const labelEditable = optionLabel.get(item);
            const label = toDisplayString(labelEditable?.displayValue ?? labelEditable?.value ?? "").trim();
            const valueEditable = optionValue ? optionValue.get(item) : labelEditable;
            const value = toDisplayString(valueEditable?.displayValue ?? valueEditable?.value ?? label).trim();
            if (!label && !value) {
                continue;
            }
            if (enableDeduplicate) {
                if (seen.has(value)) {
                    continue;
                }
                seen.add(value);
            }
            result.push({ id: item.id, label: label || value, value });
        }
        return result;
    }, [rawItems, optionLabel, optionValue, enableDeduplicate]);

    const filteredOptions = useMemo(() => {
        if (!enableSearch || !query.trim()) {
            return mappedOptions;
        }
        const normalizedQuery = query.trim().toLowerCase();
        return mappedOptions.filter(option => option.label.toLowerCase().includes(normalizedQuery));
    }, [mappedOptions, enableSearch, query]);

    const valueToLabel = useMemo(() => {
        const map = new Map<string, string>();
        for (const option of mappedOptions) {
            map.set(option.value, option.label);
        }
        return map;
    }, [mappedOptions]);

    const hasSelection = selectedValues.length > 0;
    const selectedText = useMemo(() => {
        const labels = selectedValues.map(value => valueToLabel.get(value) || value);
        return labels.join(resolvedDelimiter);
    }, [selectedValues, valueToLabel, resolvedDelimiter]);

    const setSelectedValues = useCallback(
        (nextValues: string[]) => {
            const normalized = enableDeduplicate ? Array.from(new Set(nextValues)) : nextValues;
            const nextValue = normalized.join(resolvedDelimiter);
            if (valueAttribute && !valueAttribute.readOnly) {
                valueAttribute.setValue(nextValue);
            }
        },
        [valueAttribute, enableDeduplicate]
    );

    const handleToggle = useCallback(() => {
        if (isReadOnly) {
            return;
        }
        setIsOpen(open => !open);
    }, [isReadOnly]);

    const handleClear = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            if (valueAttribute && !valueAttribute.readOnly) {
                valueAttribute.setValue("");
            }
        },
        [valueAttribute]
    );

    const handleSelect = useCallback(
        (value: string) => {
            if (isReadOnly) {
                return;
            }
            if (enableMultiSelect) {
                const nextValues = selectedSet.has(value)
                    ? selectedValues.filter(item => item !== value)
                    : [...selectedValues, value];
                setSelectedValues(nextValues);
            } else {
                setSelectedValues([value]);
                setIsOpen(false);
            }
        },
        [enableMultiSelect, isReadOnly, selectedSet, selectedValues, setSelectedValues]
    );

    useEffect(() => {
        if (!isOpen) {
            setQuery("");
        }
    }, [isOpen]);

    useEffect(() => {
        function handleOutside(event: MouseEvent): void {
            if (!wrapperRef.current) {
                return;
            }
            if (!wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const isLoading = options?.status === ValueStatus.Loading;

    return (
        <div
            ref={wrapperRef}
            className={`mx-selectbox ${enableMultiSelect ? "is-multi" : "is-single"} ${isReadOnly ? "is-disabled" : ""} ${
                dropdownPlacement ? `is-${dropdownPlacement}` : "is-auto"
            }`}
        >
            <div
                className={`mx-selectbox__control ${isOpen ? "is-open" : ""}`}
                onClick={handleToggle}
                role="button"
                tabIndex={props.tabIndex}
                onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleToggle();
                    }
                    if (event.key === "Escape") {
                        setIsOpen(false);
                    }
                }}
            >
                <div className={`mx-selectbox__value ${hasSelection ? "" : "is-placeholder"}`}>
                    {!hasSelection ? (
                        <span>{placeholderText}</span>
                    ) : showTagDisplay ? (
                        <div className="mx-selectbox__tags">
                            {selectedValues.map(value => {
                                const label = valueToLabel.get(value) || value;
                                return (
                                    <span key={value} className="mx-selectbox__tag">
                                        <span className="mx-selectbox__tag-label">{label}</span>
                                        {showTagRemove && !isReadOnly && (
                                            <button
                                                type="button"
                                                className="mx-selectbox__tag-remove"
                                                onClick={event => {
                                                    event.stopPropagation();
                                                    handleSelect(value);
                                                }}
                                                aria-label={`Remove ${label}`}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <span>{selectedText}</span>
                    )}
                </div>
                {hasSelection && showClearButton && !isReadOnly && (
                    <button className="mx-selectbox__clear" type="button" onClick={handleClear} aria-label="Clear" />
                )}
                <span className="mx-selectbox__arrow" />
            </div>

            {isOpen && (
                <div className="mx-selectbox__panel">
                    {enableSearch && (
                        <input
                            className="mx-selectbox__search"
                            type="text"
                            value={query}
                            placeholder={searchPlaceholder || "Search"}
                            onChange={event => setQuery(event.currentTarget.value)}
                            autoFocus
                        />
                    )}
                    <div className="mx-selectbox__options">
                        {isLoading && <div className="mx-selectbox__empty">Loading...</div>}
                        {!isLoading && filteredOptions.length === 0 && (
                            <div className="mx-selectbox__empty">No results</div>
                        )}
                        {filteredOptions.map(option => {
                            const isSelected = selectedSet.has(option.value);
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    className="mx-selectbox__option"
                                    onClick={() => handleSelect(option.value)}
                                >
                                    <span className={`mx-selectbox__check ${isSelected ? "is-checked" : ""}`} />
                                    <span className="mx-selectbox__label">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

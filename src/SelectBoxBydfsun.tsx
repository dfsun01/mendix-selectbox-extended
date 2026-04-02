// @ts-nocheck
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./ui/SelectBoxBydfsun.css";

function parseDelimited(value, delimiter) {
    return value
        .split(delimiter)
        .map(item => item.trim())
        .filter(item => item.length > 0);
}

function toDisplayString(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return value.toString();
}

function resolveTextTemplate(value, fallback) {
    if (!value) {
        return fallback;
    }
    if (typeof value === "string") {
        return value.length > 0 ? value : fallback;
    }
    if (value.status === "available") {
        const resolved = value.value ?? "";
        return resolved.length > 0 ? resolved : fallback;
    }
    return fallback;
}

export function SelectBoxBydfsun(props) {
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
        renderDropdownInBody,
        dropdownZIndex,
        dropdownPlacement,
        enableMultiSelect,
        enableSearch,
        enableDeduplicate,
        onChangeAction
    } = props;

    const wrapperRef = useRef(null);
    const controlRef = useRef(null);
    const panelRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [overlayStyle, setOverlayStyle] = useState(undefined);

    const currentValue = toDisplayString(valueAttribute?.value ?? "");
    const resolvedDelimiter = delimiter && delimiter.length > 0 ? delimiter : ", ";
    const selectedValues = useMemo(
        () => parseDelimited(currentValue, resolvedDelimiter),
        [currentValue, resolvedDelimiter]
    );
    const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

    const isReadOnly = valueAttribute?.readOnly ?? false;
    const placeholderText = resolveTextTemplate(placeholder, "Select...");
    const zIndexValue = typeof dropdownZIndex === "number" ? dropdownZIndex : 1060;

    const rawItems = useMemo(() => {
        if (!options || options.status !== "available" || !options.items) {
            return [];
        }
        return options.items;
    }, [options]);

    const mappedOptions = useMemo(() => {
        if (!optionLabel) {
            return [];
        }
        const seen = new Set();
        const result = [];
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
        const map = new Map();
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

    const applyValue = useCallback(
        nextValue => {
            if (valueAttribute && !valueAttribute.readOnly) {
                valueAttribute.setValue(nextValue);
            }
            if (onChangeAction && onChangeAction.canExecute) {
                onChangeAction.execute();
            }
        },
        [valueAttribute, onChangeAction]
    );

    const setSelectedValues = useCallback(
        nextValues => {
            const normalized = enableDeduplicate ? Array.from(new Set(nextValues)) : nextValues;
            const nextValue = normalized.join(resolvedDelimiter);
            applyValue(nextValue);
        },
        [applyValue, enableDeduplicate, resolvedDelimiter]
    );

    const handleToggle = useCallback(() => {
        if (isReadOnly) {
            return;
        }
        setIsOpen(open => !open);
    }, [isReadOnly]);

    const handleClear = useCallback(
        event => {
            event.stopPropagation();
            applyValue("");
        },
        [applyValue]
    );

    const handleSelect = useCallback(
        value => {
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
        if (!isOpen || !renderDropdownInBody) {
            setOverlayStyle(undefined);
            return;
        }

        const estimatePanelHeight = 280;

        function computeStyle() {
            const controlEl = controlRef.current;
            if (!controlEl) {
                return;
            }
            const rect = controlEl.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const preferred =
                dropdownPlacement === "top" || dropdownPlacement === "bottom"
                    ? dropdownPlacement
                    : spaceBelow < estimatePanelHeight && spaceAbove > spaceBelow
                      ? "top"
                      : "bottom";

            const base = {
                position: "fixed",
                left: Math.max(0, rect.left),
                right: "auto",
                width: Math.max(0, rect.width),
                zIndex: zIndexValue
            };

            if (preferred === "top") {
                setOverlayStyle({ ...base, bottom: Math.max(0, window.innerHeight - rect.top + 4) });
            } else {
                setOverlayStyle({ ...base, top: Math.max(0, rect.bottom + 4) });
            }
        }

        computeStyle();
        window.addEventListener("resize", computeStyle);
        window.addEventListener("scroll", computeStyle, true);
        return () => {
            window.removeEventListener("resize", computeStyle);
            window.removeEventListener("scroll", computeStyle, true);
        };
    }, [isOpen, renderDropdownInBody, dropdownPlacement, zIndexValue]);

    useEffect(() => {
        function handleOutside(event) {
            const target = event.target;
            if (!target) {
                return;
            }
            if (wrapperRef.current && wrapperRef.current.contains(target)) {
                return;
            }
            if (panelRef.current && panelRef.current.contains(target)) {
                return;
            }
            setIsOpen(false);
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const isLoading = options?.status === "loading";

    const valueNode = !hasSelection
        ? createElement("span", null, placeholderText)
        : showTagDisplay
          ? createElement(
                "div",
                { className: "mx-selectbox__tags" },
                selectedValues.map(value => {
                    const label = valueToLabel.get(value) || value;
                    const removeButton =
                        showTagRemove && !isReadOnly
                            ? createElement(
                                  "button",
                                  {
                                      type: "button",
                                      className: "mx-selectbox__tag-remove",
                                      onClick: event => {
                                          event.stopPropagation();
                                          handleSelect(value);
                                      },
                                      "aria-label": `Remove ${label}`
                                  },
                                  "×"
                              )
                            : null;
                    return createElement(
                        "span",
                        { key: value, className: "mx-selectbox__tag" },
                        createElement("span", { className: "mx-selectbox__tag-label" }, label),
                        removeButton
                    );
                })
            )
          : createElement("span", null, selectedText);

    const clearButton =
        hasSelection && showClearButton && !isReadOnly
            ? createElement("button", {
                  className: "mx-selectbox__clear",
                  type: "button",
                  onClick: handleClear,
                  "aria-label": "Clear"
              })
            : null;

    const controlNode = createElement(
        "div",
        {
            ref: controlRef,
            className: `mx-selectbox__control ${isOpen ? "is-open" : ""}`,
            onClick: handleToggle,
            role: "button",
            tabIndex: props.tabIndex,
            onKeyDown: event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleToggle();
                }
                if (event.key === "Escape") {
                    setIsOpen(false);
                }
            }
        },
        createElement("div", { className: `mx-selectbox__value ${hasSelection ? "" : "is-placeholder"}` }, valueNode),
        clearButton,
        createElement("span", { className: "mx-selectbox__arrow" })
    );

    const searchNode = enableSearch
        ? createElement("input", {
              className: "mx-selectbox__search",
              type: "text",
              value: query,
              placeholder: searchPlaceholder || "Search",
              onChange: event => setQuery(event.currentTarget.value),
              autoFocus: true
          })
        : null;

    const optionNodes = [];
    if (isLoading) {
        optionNodes.push(createElement("div", { key: "loading", className: "mx-selectbox__empty" }, "Loading..."));
    } else if (filteredOptions.length === 0) {
        optionNodes.push(createElement("div", { key: "empty", className: "mx-selectbox__empty" }, "No results"));
    } else {
        for (const option of filteredOptions) {
            const isSelected = selectedSet.has(option.value);
            optionNodes.push(
                createElement(
                    "button",
                    {
                        key: option.id,
                        type: "button",
                        className: "mx-selectbox__option",
                        onClick: () => handleSelect(option.value)
                    },
                    createElement("span", { className: `mx-selectbox__check ${isSelected ? "is-checked" : ""}` }),
                    createElement("span", { className: "mx-selectbox__label" }, option.label)
                )
            );
        }
    }

    const panelNode = isOpen
        ? createElement(
              "div",
              {
                  ref: panelRef,
                  className: `mx-selectbox__panel ${renderDropdownInBody ? "mx-selectbox__panel--portal" : ""}`,
                  style: renderDropdownInBody ? overlayStyle : { zIndex: zIndexValue }
              },
              searchNode,
              createElement("div", { className: "mx-selectbox__options" }, optionNodes)
          )
        : null;

    return createElement(
        "div",
        {
            ref: wrapperRef,
            id: props.id,
            className: `mx-selectbox ${enableMultiSelect ? "is-multi" : "is-single"} ${isReadOnly ? "is-disabled" : ""} ${
                dropdownPlacement ? `is-${dropdownPlacement}` : "is-auto"
            }`
        },
        controlNode,
        panelNode
    );
}

/*
 * Velocity, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { PluginOptionSelect } from "@utils/types";
import { React, SearchableSelect, Select, useState } from "@webpack/common";

import { resolveError, SettingProps, SettingsSection } from "./Common";

export function SelectSetting({ option, pluginSettings, definedSettings, onChange, id }: SettingProps<PluginOptionSelect>) {
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (typeof option.options === "function") {
            setLoading(true);
            option.options().then(opts => {
                setOptions(opts as any);
                setLoading(false);
            }).catch(() => {
                setOptions([]);
                setLoading(false);
            });
        } else {
            setOptions(option.options as any);
        }
    }, []);

    const defaultValue = options?.find(o => o.default)?.value ?? null;
    const [state, setState] = useState<any>(pluginSettings[id] ?? defaultValue);
    const [error, setError] = useState<string | null>(null);

    function handleChange(newValue: any) {
        const isValid = option.isValid?.call(definedSettings, newValue) ?? true;
        setState(newValue);
        setError(resolveError(isValid));
        if (isValid === true) onChange(newValue);
    }

    function handleClear() {
        setState(defaultValue);
        onChange(defaultValue);
    }

    const isDefault = state === defaultValue;

    if (loading) {
        return (
            <SettingsSection name={id} description={option.description} error={error}>
                <div>Loading options...</div>
            </SettingsSection>
        );
    }

    const renderOptionPrefix = (opt: any) => {
        if (!opt || !opt.icon) {
            return null;
        }
        const IconElement = typeof opt.icon === "function" ? opt.icon() : opt.icon;
        return IconElement;
    };

    const renderOptionLabel = (opt: any) => {
        const pluginOpt = opt as any;
        if (pluginOpt.icon) {
            const IconElement =
                typeof pluginOpt.icon === "function" ? pluginOpt.icon() : pluginOpt.icon;
            return (
                <div className="vc-select-option">
                    {IconElement}
                    {opt.label}
                </div>
            );
        }
        return opt.label;
    };

    const renderOptionValue = (opts: any) => {
        const opt = Array.isArray(opts) ? opts[0] : opts;
        if (!opt) return null;
        const pluginOpt = opt as any;
        if (pluginOpt.icon) {
            const IconElement =
                typeof pluginOpt.icon === "function" ? pluginOpt.icon() : pluginOpt.icon;
            return (
                <div className="vc-select-option">
                    {IconElement}
                    {opt.label}
                </div>
            );
        }
        return opt.label;
    };

    return (
        <SettingsSection name={id} description={option.description} error={error}>
            {option.isSearchable ? (
                <SearchableSelect
                    placeholder={option.placeholder ?? "Select an option"}
                    options={options}
                    value={options.find(o => o.value === state)}
                    maxVisibleItems={5}
                    closeOnSelect={true}
                    onChange={handleChange}
                    renderOptionPrefix={renderOptionPrefix}
                    {...option.componentProps}
                />
            ) : (
                <Select
                    placeholder={option.placeholder ?? "Select an option"}
                    options={options}
                    maxVisibleItems={5}
                    closeOnSelect={true}
                    select={handleChange}
                    isSelected={v => v === state}
                    serialize={v => String(v)}
                    isDisabled={option.disabled?.call(definedSettings) ?? false}
                    clearable={!isDefault}
                    clear={handleClear}
                    renderOptionLabel={renderOptionLabel}
                    renderOptionValue={renderOptionValue}
                    {...option.componentProps}
                />
            )}
        </SettingsSection>
    );
}

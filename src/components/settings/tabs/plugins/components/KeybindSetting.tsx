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

import { PluginOptionKeybind } from "@utils/types";
import { KeybindRecorder, React, useState } from "@webpack/common";

import { resolveError, SettingProps, SettingsSection } from "./Common";

export function KeybindSetting({ option, pluginSettings, definedSettings, id, onChange }: SettingProps<PluginOptionKeybind>) {
    const def = pluginSettings[id] ?? option.default ?? [];

    const [state, setState] = useState(def);
    const [mode, setMode] = useState<"DEFAULT" | "RECORDING">("DEFAULT");
    const [error, setError] = useState<string | null>(null);

    function handleChange(newValue: number[]) {
        const isValid = option.isValid?.call(definedSettings, newValue) ?? true;

        setState(newValue);
        setError(resolveError(isValid));
        setMode("DEFAULT");

        if (isValid === true) {
            onChange(newValue);
        }
    }

    function handleClick() {
        setMode(mode === "RECORDING" ? "DEFAULT" : "RECORDING");
    }

    const displayValue = Array.isArray(state) ? state : [];

    return (
        <SettingsSection name={id} description={option.description} error={error}>
            <KeybindRecorder
                mode={mode}
                value={displayValue}
                onChange={handleChange}
                onClick={handleClick}
                disabled={option.disabled?.call(definedSettings) ?? false}
                {...option.componentProps}
            />
        </SettingsSection>
    );
}

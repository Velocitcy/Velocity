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

import { classNameFactory } from "@api/Styles";
import { classes } from "@utils/misc";
import { wordsFromCamel, wordsToTitle } from "@utils/text";
import { DefinedSettings, PluginOptionBase } from "@utils/types";
import { Text } from "@webpack/common";
import { PropsWithChildren } from "react";

export const cl = classNameFactory("vc-plugins-setting-");

interface SettingBaseProps<T> {
    option: T;
    onChange(newValue: any): void;
    pluginSettings: {
        [setting: string]: any;
        enabled: boolean;
    };
    id: string;
    definedSettings?: DefinedSettings;
}

export type SettingProps<T extends PluginOptionBase> = SettingBaseProps<T>;
export type ComponentSettingProps<T extends Omit<PluginOptionBase, "description" | "placeholder">> = SettingBaseProps<T>;

export function resolveError(isValidResult: boolean | string) {
    if (typeof isValidResult === "string") return isValidResult;

    return isValidResult ? null : "Invalid input provided";
}

interface SettingsSectionProps extends PropsWithChildren {
    name: string;
    description: string;
    error?: string | null;
    inlineSetting?: boolean;
}

export function SettingsSection({ name, description, error, inlineSetting, children }: SettingsSectionProps) {
    return (
        <div className={cl("section")}>
            <div className={classes(cl("content"), inlineSetting && cl("inline"))}>
                <div className={cl("label")}>
                    {name && <Text className={cl("title")} variant="text-md/medium">{wordsToTitle(wordsFromCamel(name))}</Text>}
                    {description && <Text className={cl("description")} variant="text-sm/normal">{description}</Text>}
                </div>
                {children}
            </div>
            {error && <Text className={cl("error")} variant="text-sm/normal">{error}</Text>}
        </div>
    );
}

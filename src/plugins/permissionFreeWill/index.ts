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

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { canonicalizeMatch } from "@utils/patches";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    lockout: {
        type: OptionType.BOOLEAN,
        default: true,
        description: 'Bypass the permission lockout prevention ("Pretty sure you don\'t want to do this")',
        restartNeeded: true
    },
    onboarding: {
        type: OptionType.BOOLEAN,
        default: true,
        description: 'Bypass the onboarding requirements ("Making this change will make your server incompatible [...]")',
        restartNeeded: true
    }
});

export default definePlugin({
    name: "PermissionFreeWill",
    description: "Disables the client-side restrictions for channel permission management.",
    authors: [Devs.lewisakura],

    patches: [
        // Permission lockout, just set the check to true
        {
            find: "#{intl::STAGE_CHANNEL_CANNOT_OVERWRITE_PERMISSION}",
            replacement: [
                {
                    match: /case"DENY":.{0,50}if\((?=\i\.\i\.can)/,
                    replace: "$&true||"
                }
            ],
            predicate: () => settings.store.lockout
        },
        // Onboarding, same thing but we need to prevent the check
        {
            find: "#{intl::ONBOARDING_CHANNEL_THRESHOLD_WARNING}",
            replacement: [
                {
                    // replace export getters with functions that always resolve to true
                    match: /{(?:\i:\(\)=>\i,?){2}}/,
                    replace: m => m.replaceAll(canonicalizeMatch(/\(\)=>\i/g), "()=>()=>Promise.resolve(true)")
                }
            ],
            predicate: () => settings.store.onboarding
        }
    ],
    settings
});

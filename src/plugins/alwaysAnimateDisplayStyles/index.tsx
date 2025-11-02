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

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";

const DisplayEffectTypes = findByPropsLazy("ANIMATED", "STATIC", "PLAIN");

export default definePlugin({
    name: "AlwaysShowDisplayEffects",
    description: "Always show display name effects without needing to hover",
    authors: [Devs.Velocity],
    unavailable: true,

    patches: [
        {
            find: "data-username-with-effects",
            replacement: [
                {
                    match: /,effectDisplayType:(\i)=\i\.\i\.STATIC,/,
                    replace: ",effectDisplayType:$1=$self.DisplayEffectTypes.ANIMATED,"
                },
                {
                    match: /\[(\i)\.animated\]:(\i)===\i\.\i\.ANIMATED&&!\i,/,
                    replace: "[$1.animated]:true,"
                }
            ]
        }
    ],

    DisplayEffectTypes
});

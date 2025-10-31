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
import { canonicalizeMatch } from "@utils/patches";
import definePlugin from "@utils/types";

// duplicate values have multiple branches with different types. Just include all to be safe
const nameMap = {
    radio: "MenuRadioItem",
    separator: "MenuSeparator",
    checkbox: "MenuCheckboxItem",
    groupstart: "MenuGroup",

    control: "MenuControlItem",
    compositecontrol: "MenuControlItem",

    item: "MenuItem",
    customitem: "MenuItem",
};

export default definePlugin({
    name: "MenuItemDemanglerAPI",
    description: "Demangles Discord's Menu Item module",
    authors: [Devs.Ven],
    required: true,
    patches: [
        {
            find: '"Menu API',
            replacement: {
                match: /function.{0,80}type===(\i\.\i)\).{0,50}navigable:.+?Menu API/s,
                replace: (m, mod) => {
                    const nameAssignments = [] as string[];

                    // if (t.type === m.MenuItem)
                    const typeCheckRe = canonicalizeMatch(/\(\i\.type===(\i\.\i)\)/g);
                    // push({type:"item"})
                    const pushTypeRe = /type:"(\w+)"/g;

                    let typeMatch: RegExpExecArray | null;
                    // for each if (t.type === ...)
                    while ((typeMatch = typeCheckRe.exec(m)) !== null) {
                        // extract the current menu item
                        const item = typeMatch[1];
                        // Set the starting index of the second regex to that of the first to start
                        // matching from after the if
                        pushTypeRe.lastIndex = typeCheckRe.lastIndex;
                        // extract the first type: "..."
                        const type = pushTypeRe.exec(m)?.[1];
                        if (type && type in nameMap) {
                            const name = nameMap[type];
                            nameAssignments.push(`Object.defineProperty(${item},"name",{value:"${name}"})`);
                        }
                    }
                    if (nameAssignments.length < 6) {
                        console.warn("[MenuItemDemanglerAPI] Expected to at least remap 6 items, only remapped", nameAssignments.length);
                    }

                    // Merge all our redefines with the actual module
                    return `${nameAssignments.join(";")};${m}`;
                },
            },
        },
    ],
});

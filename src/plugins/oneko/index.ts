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
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    speed: {
        type: OptionType.SLIDER,
        description: "Cat speed",
        default: 10,
        markers: [5, 10, 15, 20, 25, 30, 50, 100],
        stickToMarkers: false
    }
});

export default definePlugin({
    name: "oneko",
    description: "cat follow mouse (real) Emoji(\"ninja\")",
    authors: [Devs.Ven, Devs.adryd],
    settings,

    start() {
        fetch("https://raw.githubusercontent.com/adryd325/oneko.js/c4ee66353b11a44e4a5b7e914a81f8d33111555e/oneko.js")
            .then(x => x.text())
            .then(s => s.replace("./oneko.gif", "https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif")
                .replace("(isReducedMotion)", "(false)")
                .replace("const nekoSpeed = 10", `const nekoSpeed = ${settings.store.speed}`))
            .then(eval);
    },

    stop() {
        document.getElementById("oneko")?.remove();
    }
});

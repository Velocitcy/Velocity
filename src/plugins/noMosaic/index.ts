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
    inlineVideo: {
        description: "Play videos without carousel modal",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    }
});

export default definePlugin({
    name: "NoMosaic",
    authors: [Devs.AutumnVN],
    description: "Removes Discord image mosaic",
    tags: ["image", "mosaic", "media"],

    settings,

    patches: [
        {
            find: '=>"IMAGE"===',
            replacement: {
                match: /=>"IMAGE"===\i\|\|"VIDEO"===\i(?:\|\|("VISUAL_PLACEHOLDER"===\i))?;/,
                replace: (_, visualPlaceholderPred) => visualPlaceholderPred != null ? `=>${visualPlaceholderPred};` : "=>false;"
            }
        },
        {
            find: "renderAttachments(",
            predicate: () => settings.store.inlineVideo,
            replacement: {
                match: /url:(\i)\.url\}\);return /,
                replace: "$&$1.content_type?.startsWith('image/')&&"
            }
        },
    ]
});

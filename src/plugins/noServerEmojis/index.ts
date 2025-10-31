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
import type { Channel, Emoji } from "@vencord/discord-types";

const settings = definePluginSettings({
    shownEmojis: {
        description: "The types of emojis to show in the autocomplete menu.",
        type: OptionType.SELECT,
        default: "onlyUnicode",
        options: [
            { label: "Only unicode emojis", value: "onlyUnicode" },
            { label: "Unicode emojis and server emojis from current server", value: "currentServer" },
            { label: "Unicode emojis and all server emojis (Discord default)", value: "all" }
        ]
    }
});

export default definePlugin({
    name: "NoServerEmojis",
    authors: [Devs.UlyssesZhan],
    description: "Do not show server emojis in the autocomplete menu.",
    settings,

    patches: [
        {
            find: "}searchWithoutFetchingLatest(",
            replacement: {
                match: /\.nameMatchesChain\(\i\)\.reduce\(\((\i),(\i)\)=>\{(?<=channel:(\i).+?)/,
                replace: "$&if($self.shouldSkip($3,$2))return $1;"
            }
        }
    ],

    shouldSkip(channel: Channel | undefined | null, emoji: Emoji) {
        if (emoji.type !== 1) {
            return false;
        }

        if (settings.store.shownEmojis === "onlyUnicode") {
            return true;
        }

        if (settings.store.shownEmojis === "currentServer") {
            return emoji.guildId !== (channel != null ? channel.getGuildId() : null);
        }

        return false;
    }
});

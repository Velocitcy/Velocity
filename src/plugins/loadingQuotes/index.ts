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
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, StartAt } from "@utils/types";

import quotes from "./quotes.json";

const settings = definePluginSettings({
    replaceEvents: {
        description: "Should this plugin also apply during events with special event themed quotes? (e.g. Halloween)",
        type: OptionType.BOOLEAN,
        default: true
    },
    enablePluginPresetQuotes: {
        description: "Enable the quotes preset by this plugin",
        type: OptionType.BOOLEAN,
        default: true
    },
    enableDiscordPresetQuotes: {
        description: "Enable Discord's preset quotes (including event quotes, during events)",
        type: OptionType.BOOLEAN,
        default: false
    }
});

export default definePlugin({
    name: "LoadingQuotes",
    description: "Replace Discord’s loading quotes",
    authors: [Devs.Ven, Devs.KraXen72, Devs.UlyssesZhan],
    settings,
    startAt: StartAt.WebpackReady,

    patches: [
        {
            find: "#{intl::LOADING_DID_YOU_KNOW}",
            replacement: [
                {
                    match: /"_loadingText".+?(?=(\i)\[.{0,10}\.random)/,
                    replace: "$&$self.mutateQuotes($1),"
                },
                {
                    match: /"_eventLoadingText".+?(?=(\i)\[.{0,10}\.random)/,
                    replace: "$&$self.mutateQuotes($1),",
                    predicate: () => settings.store.replaceEvents
                }
            ]
        },
    ],

    mutateQuotes(quotesArr: string[]) {
        try {
            const { enableDiscordPresetQuotes, enablePluginPresetQuotes } = settings.store;

            if (!enableDiscordPresetQuotes)
                quotesArr.length = 0;

            if (enablePluginPresetQuotes && Array.isArray(quotes.presetQuotes))
                quotesArr.push(...quotes.presetQuotes);

        } catch (e) {
            new Logger("LoadingQuotes").error("Failed to mutate quotes", e);
        }
    }
});

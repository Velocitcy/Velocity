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
import { findByPropsLazy } from "@webpack";
import { UserStore } from "@webpack/common";

const MessageActions = findByPropsLazy("deleteMessage");

const settings = definePluginSettings({
    prefix: {
        type: OptionType.SELECT,
        description: "Prefix to trigger ghost message deletion",
        options: [
            { label: "! (Exclamation)", value: "!", default: true },
            { label: ". (Period)", value: "." },
            { label: "? (Question)", value: "?" },
            { label: "~ (Tilde)", value: "~" },
            { label: "+ (Plus)", value: "+" },
            { label: "_ (Underscore)", value: "_" },
            { label: "- (Dash)", value: "-" },
            { label: "= (Equals)", value: "=" }
        ]
    },
    ignoreChannels: {
        type: OptionType.STRING,
        description: "Channel IDs to ignore (comma separated)",
        default: "",
        placeholder: "Enter User IDs"
    }
});

export default definePlugin({
    name: "GhostMessage",
    description: "Deletes your messages that start with a specific prefix",
    authors: [Devs.Velocity],

    settings,

    flux: {
        async MESSAGE_CREATE(event) {
            const { message } = event;
            const currentUser = UserStore.getCurrentUser();

            if (message.author.id !== currentUser?.id) return;
            if (!message.content?.startsWith(settings.store.prefix)) return;

            const ignoredChannels = settings.store.ignoreChannels
                .split(",")
                .map(id => id.trim())
                .filter(id => id.length > 0);

            if (ignoredChannels.includes(message.channel_id)) return;

            try {
                await MessageActions.deleteMessage(message.channel_id, message.id);
            } catch (e) {
                console.error("Failed to delete ghost message:", e);
            }
        }
    }
});

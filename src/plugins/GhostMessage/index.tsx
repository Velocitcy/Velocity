/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
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
        placeholder: "123456789,987654321"
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

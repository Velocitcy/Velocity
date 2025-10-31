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
import { MessageJSON } from "@vencord/discord-types";
import { ChannelType } from "@vencord/discord-types/enums";
import { ChannelStore, ReadStateStore, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    channelToAffect: {
        type: OptionType.SELECT,
        description: "Select the type of DM for the plugin to affect",
        options: [
            { label: "Both", value: "both_dms", default: true },
            { label: "User DMs", value: "user_dm" },
            { label: "Group DMs", value: "group_dm" },
        ]
    },
    allowMentions: {
        type: OptionType.BOOLEAN,
        description: "Receive audio pings for @mentions",
        default: false,
    },
    allowEveryone: {
        type: OptionType.BOOLEAN,
        description: "Receive audio pings for @everyone and @here in group DMs",
        default: false,
    },
});

export default definePlugin({
    name: "OnePingPerDM",
    description: "If unread messages are sent by a user in DMs multiple times, you'll only receive one audio ping. Read the messages to reset the limit",
    authors: [Devs.ProffDea],
    settings,
    patches: [
        {
            find: ".getDesktopType()===",
            replacement: [
                {
                    match: /(\i\.\i\.getDesktopType\(\)===\i\.\i\.NEVER)\)/,
                    replace: "$&if(!$self.isPrivateChannelRead(arguments[0]?.message))return;else "
                },
                {
                    match: /sound:(\i\?\i:void 0,volume:\i,onClick)/,
                    replace: "sound:!$self.isPrivateChannelRead(arguments[0]?.message)?undefined:$1"
                }
            ]
        }
    ],
    isPrivateChannelRead(message: MessageJSON) {
        const channelType = ChannelStore.getChannel(message.channel_id)?.type;
        if (
            (channelType !== ChannelType.DM && channelType !== ChannelType.GROUP_DM) ||
            (channelType === ChannelType.DM && settings.store.channelToAffect === "group_dm") ||
            (channelType === ChannelType.GROUP_DM && settings.store.channelToAffect === "user_dm") ||
            (settings.store.allowMentions && message.mentions.some(m => m.id === UserStore.getCurrentUser().id)) ||
            (settings.store.allowEveryone && message.mention_everyone)
        ) {
            return true;
        }
        return ReadStateStore.getOldestUnreadMessageId(message.channel_id) === message.id;
    },
});

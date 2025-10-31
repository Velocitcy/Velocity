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

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { DisabledLine } from "@components/DisabledLine";
import { Devs } from "@utils/constants";
import { sendMessage } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore, Menu, React, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    showIcon: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Show an icon for toggling the plugin",
        restartNeeded: true,
    },
    contextMenu: {
        type: OptionType.BOOLEAN,
        description: "Add option to toggle the functionality in the chat input context menu",
        default: true
    },
    isEnabled: {
        type: OptionType.BOOLEAN,
        description: "Toggle RepeatAfterMe",
        default: true,
    },
    cooldown: {
        type: OptionType.SLIDER,
        description: "Cooldown between repeats (seconds)",
        default: 0,
        markers: [0, 10, 20, 30, 40, 50, 60],
        stickToMarkers: false
    },
    delayBeforeSend: {
        type: OptionType.SLIDER,
        description: "Delay before sending the repeated message (seconds)",
        default: 0,
        markers: [0, 1, 2, 3, 5, 10],
        stickToMarkers: false
    }
});

let lastRepeatTime = 0;

const DMEchoToggle: ChatBarButtonFactory = ({ isMainChat }) => {
    const { isEnabled, showIcon } = settings.use(["isEnabled", "showIcon"]);
    const toggle = () => settings.store.isEnabled = !settings.store.isEnabled;

    if (!isMainChat || !showIcon) return null;

    return (
        <ChatBarButton
            tooltip={isEnabled ? "Disable RepeatAfterMe" : "Enable RepeatAfterMe"}
            onClick={toggle}
        >
            <div style={{ position: "relative" }}>
                <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ scale: "1.2" }}>
                    <path fill="currentColor" d="M10 8.26667V4L3 11.4667L10 18.9333V14.56C15 14.56 18.5 16.2667 21 20C20 14.6667 17 9.33333 10 8.26667Z" />
                    {!isEnabled && <DisabledLine />}
                </svg>
            </div>
        </ChatBarButton>
    );
};

const ChatBarContextCheckbox: NavContextMenuPatchCallback = children => {
    const { isEnabled, contextMenu } = settings.use(["isEnabled", "contextMenu"]);
    if (!contextMenu) return;

    const group = findGroupChildrenByChildId("submit-button", children);
    if (!group) return;

    const idx = group.findIndex(c => c?.props?.id === "submit-button");

    group.splice(idx + 1, 0,
        <Menu.MenuCheckboxItem
            id="vc-repeat-after-me"
            label="Enable Repeat After Me"
            checked={isEnabled}
            action={() => settings.store.isEnabled = !settings.store.isEnabled}
        />
    );
};

export default definePlugin({
    name: "RepeatAfterMe",
    description: "Repeats whatever someone says in DMs",
    authors: [Devs.Velocity],
    settings,

    contextMenus: {
        "textarea-context": ChatBarContextCheckbox
    },

    commands: [{
        name: "repeatafterme",
        description: "Toggle RepeatAfterMe",
        inputType: ApplicationCommandInputType.BUILT_IN,
        options: [
            {
                name: "value",
                description: "whether to hide or not that you're typing (default is toggle)",
                required: false,
                type: ApplicationCommandOptionType.BOOLEAN,
            },
        ],
        execute: async (args, ctx) => {
            settings.store.isEnabled = !!findOption(args, "value", !settings.store.isEnabled);
            sendBotMessage(ctx.channel.id, {
                content: settings.store.isEnabled ? "RepeatAfterMe enabled!" : "RepeatAfterMe disabled!",
            });
        },
    }],


    flux: {
        MESSAGE_CREATE(event) {
            if (!settings.store.isEnabled) return;

            const { message } = event;
            const channel = ChannelStore.getChannel(message.channel_id);

            if (channel?.type === 1 && message.author.id !== UserStore.getCurrentUser()?.id && !message.author.bot) {
                const now = Date.now();
                const cooldownMs = settings.store.cooldown * 1000;
                const delayMs = settings.store.delayBeforeSend * 1000;

                if (now - lastRepeatTime < cooldownMs) return;

                const { content } = message;
                if (content) {
                    setTimeout(() => {
                        sendMessage(message.channel_id, { content });
                    }, delayMs);

                    lastRepeatTime = now;
                }
            }
        }
    },

    renderChatBarButton: DMEchoToggle,
});

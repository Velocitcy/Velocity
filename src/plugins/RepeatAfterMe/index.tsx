/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { IconTypes, ReplyIcon } from "@components/Icons";
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
        description: "Toggle DM Echo",
        default: true,
    },
    cooldown: {
        type: OptionType.SLIDER,
        description: "Cooldown between repeats (seconds)",
        default: 0,
        markers: [0, 10, 20, 30, 40, 50, 60],
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
                {ReplyIcon(IconTypes.DEFAULT)()}
                {!isEnabled && (
                    <svg width={24} height={24} viewBox="0 0 24 24" style={{ position: "absolute", top: 0, left: 0 }}>
                        <path fill="var(--status-danger)" d="m21.178 1.70703 1.414 1.414L4.12103 21.593l-1.414-1.415L21.178 1.70703Z" />
                    </svg>
                )}
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
            label="Disable RepeatAfterMe"
            checked={!isEnabled}
            action={() => settings.store.isEnabled = !settings.store.isEnabled}
        />
    );
};

export default definePlugin({
    name: "RepeatAfterMe",
    description: "Repeats whatever someone says in DMs (ignores self messages)",
    authors: [Devs.Velocity],
    settings,

    contextMenus: {
        "textarea-context": ChatBarContextCheckbox
    },

    flux: {
        MESSAGE_CREATE(event) {
            if (!settings.store.isEnabled) return;

            const { message } = event;
            const channel = ChannelStore.getChannel(message.channel_id);

            if (channel?.type === 1 && message.author.id !== UserStore.getCurrentUser()?.id && !message.author.bot) {
                const now = Date.now();
                const cooldownMs = settings.store.cooldown * 1000;

                if (now - lastRepeatTime < cooldownMs) return;

                const { content } = message;
                if (content) {
                    sendMessage(message.channel_id, { content });
                    lastRepeatTime = now;
                }
            }
        }
    },

    renderChatBarButton: DMEchoToggle,
});

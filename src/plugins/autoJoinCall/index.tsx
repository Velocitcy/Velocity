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

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { CogWheel } from "@components/Icons";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { Devs } from "@utils/constants";
import { Iconclasses, setIconClassName } from "@utils/icon";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Menu } from "@webpack/common";

const VoiceActions = findByPropsLazy("selectVoiceChannel", "disconnect");
const ChannelStore = findByPropsLazy("getChannel", "getDMFromUserId");
const VoiceStateStore = findByPropsLazy("getVoiceStatesForChannel");
const MediaEngineStore = findByPropsLazy("isSelfMute", "setLocalMute");
const ToggleMute = findByPropsLazy("toggleSelfMute");
const ToggleDeafen = findByPropsLazy("toggleSelfDeaf");

const settings = definePluginSettings({
    channelId: {
        type: OptionType.STRING,
        description: "Channel ID (works with DM and Guild VC)",
        default: ""
    },
    autoMute: {
        type: OptionType.BOOLEAN,
        description: "Automatically mute on join",
        default: false
    },
    autoDeafen: {
        type: OptionType.BOOLEAN,
        description: "Automatically deafen on join",
        default: false
    }
});

function joinCall(channelId: string) {
    const channel = ChannelStore?.getChannel(channelId);
    if (!channel) return;

    const voiceStates = VoiceStateStore?.getVoiceStatesForChannel(channel);
    if (!voiceStates || Object.keys(voiceStates).length === 0) return;

    try {
        VoiceActions.selectVoiceChannel(channelId);

        try {
            if (settings.store.autoDeafen && ToggleDeafen?.toggleSelfDeaf) {
                ToggleDeafen.toggleSelfDeaf();
            } else if (settings.store.autoMute) {
                if (ToggleMute?.toggleSelfMute) {
                    ToggleMute.toggleSelfMute();
                } else if (MediaEngineStore?.setLocalMute) {
                    MediaEngineStore.setLocalMute(true);
                }
            }
        } catch (err) { }
    } catch (e) { }
}

const streamContextMenuPatch: NavContextMenuPatchCallback = children => {
    const menuItem = (
        <Menu.MenuItem
            id="vc-autojoin-settings"
            label="Auto Join Settings"
            icon={setIconClassName(CogWheel, Iconclasses.discord)}
            action={() => openPluginModal(Velocity.Plugins.plugins.autoJoinCall)}
        />
    );

    children.splice(4, 0, menuItem);
};

export default definePlugin({
    name: "autoJoinCall",
    description: "Automatically joins the specified DM or guild call",
    authors: [Devs.Velocity],
    settings,

    contextMenus: {
        "more-settings-context": streamContextMenuPatch
    },

    flux: {
        CALL_CREATE(data: { channelId: string; }) {
            const { channelId } = settings.store;
            if (!channelId) return;

            if (data.channelId === channelId) {
                setTimeout(() => joinCall(channelId), 100);
            }
        }
    },

    start() {
        const { channelId } = settings.store;
        if (!channelId) return;

        joinCall(channelId);
    }
});

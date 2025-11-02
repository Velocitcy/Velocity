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
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher, Menu, React } from "@webpack/common";

const VoiceActions = findByPropsLazy("selectVoiceChannel", "disconnect");
const ChannelStore = findByPropsLazy("getChannel", "getDMFromUserId");
const VoiceStateStore = findByPropsLazy("getVoiceStatesForChannel");
const MediaEngineStore = findByPropsLazy("isSelfMute", "setLocalMute");
const ToggleMute = findByPropsLazy("toggleSelfMute");
const ToggleDeafen = findByPropsLazy("toggleSelfDeaf");

const settings = definePluginSettings({
    channelId: {
        type: OptionType.STRING,
        description: "Channel IDs (comma separated for multiple channels)",
        default: ""
    },
    muteOption: {
        type: OptionType.RADIO,
        description: "Audio state on join",
        options: [
            { label: "None", value: "none", default: true },
            { label: "Auto Mute", value: "mute" },
            { label: "Auto Deafen", value: "deafen" }
        ]
    },
    autoStream: {
        type: OptionType.BOOLEAN,
        description: "Automatically start streaming on join",
        default: false
    },
    streamSound: {
        type: OptionType.BOOLEAN,
        description: "Enable sound when streaming",
        default: true
    },
    streamSource: {
        type: OptionType.SELECT,
        isSearchable: true,
        description: "Stream source",
        options: async () => {
            try {
                const sources = await DiscordNative.desktopCapture.getDesktopCaptureSources({
                    types: ["screen"]
                });
                return sources.map((s: any, index: number) => ({
                    label: `Screen ${index + 1}`,
                    value: s.id,
                    default: index === 0
                }));
            } catch (err) {
                return [{ label: "Screen 1", value: "screen:0:0", default: true }];
            }
        },
        onChange() {
            if (Velocity.Plugins.isPluginEnabled("StreamCrasher")) {
                const StreamCrasher = Velocity.Plugins.plugins.StreamCrasher as any;
                if (StreamCrasher?.updateStream) {
                    StreamCrasher.updateStream();
                }
            }
        }
    }
});

async function startStream(channelId: string) {
    await new Promise(r => setTimeout(r, 500));

    const sourceId = settings.store.streamSource;

    console.log("Streaming with sourceId:", sourceId);

    FluxDispatcher.dispatch({
        type: "STREAM_START",
        streamType: "call",
        guildId: null,
        channelId: channelId,
        appContext: "APP",
        sourceId: sourceId,
        sourceName: "Screen 1",
        sourceIcon: "",
        sound: settings.store.streamSound,
        previewDisabled: false,
        goLiveModalDurationMs: 2000 + Math.random() * 300,
        analyticsLocations: [
            "channel call",
            "voice control tray",
            "go live modal v2"
        ]
    });
}

function joinCall(channelId: string) {
    const channel = ChannelStore?.getChannel(channelId);
    if (!channel) return;

    const voiceStates = VoiceStateStore?.getVoiceStatesForChannel(channel);
    if (!voiceStates || Object.keys(voiceStates).length === 0) return;

    try {
        VoiceActions.selectVoiceChannel(channelId);

        try {
            const { muteOption } = settings.store;

            if (muteOption === "deafen" && ToggleDeafen?.toggleSelfDeaf) {
                ToggleDeafen.toggleSelfDeaf();
            } else if (muteOption === "mute") {
                if (ToggleMute?.toggleSelfMute) {
                    ToggleMute.toggleSelfMute();
                } else if (MediaEngineStore?.setLocalMute) {
                    MediaEngineStore.setLocalMute(true);
                }
            }

            if (settings.store.autoStream) {
                startStream(channelId);
            }
        } catch (err) { }
    } catch (e) { }
}

function getChannelIds(): string[] {
    const { channelId } = settings.store;
    if (!channelId) return [];
    return channelId.split(",").map(id => id.trim()).filter(id => id.length > 0);
}

const streamContextMenuPatch: NavContextMenuPatchCallback = children => {
    const menuItem = (
        <Menu.MenuItem
            id="vc-autojoin-settings"
            label="Auto Join Settings"
            icon={() => (<CogWheel width="24" height="24" fill="none" viewBox="0 0 24 24" className="icon_f84418 " />)}
            action={() => openPluginModal(Velocity.Plugins.plugins.AutoJoinCall)}
        />
    );

    children.splice(4, 0, menuItem);
};

const streamEnablingPatch: NavContextMenuPatchCallback = children => {
    const { autoStream } = settings.use(["autoStream"]);

    children.splice(2, 0,
        <Menu.MenuSeparator />,
        <Menu.MenuCheckboxItem
            id="vc-stream-checkbox"
            label="Auto Stream"
            subtext="Whether to automaticly start a stream thru AutoJoinCall plugin"
            checked={autoStream}
            action={() => {
                settings.store.autoStream = !settings.store.autoStream;
            }}
        />
    );
};

export default definePlugin({
    name: "AutoJoinCall",
    description: "Automatically joins the specified DM or guild call(s)",
    authors: [Devs.Velocity],
    settings,

    contextMenus: {
        "more-settings-context": streamContextMenuPatch,
        "manage-streams": streamEnablingPatch
    },

    flux: {
        CALL_CREATE(data: { channelId: string; }) {
            const channelIds = getChannelIds();
            if (channelIds.length === 0) return;

            if (channelIds.includes(data.channelId)) {
                setTimeout(() => joinCall(data.channelId), 100);
            }
        }
    },

    start() {
        const channelIds = getChannelIds();
        if (channelIds.length === 0) return;

        channelIds.forEach(id => joinCall(id));
    }
});

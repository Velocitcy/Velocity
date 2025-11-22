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
import { findByCodeLazy, findByPropsLazy, findStoreLazy } from "@webpack";
import { ChannelStore, VoiceStateStore } from "@webpack/common";

import { streamContextMenuPatch, streamEnablingPatch } from "./contextMenu";

const RTCConnectionStore = findStoreLazy("OverlayRTCConnectionStore");
const MediaEngineStore = findByPropsLazy("isSelfMute", "isSelfDeaf");
const ApplicationStreamingStore = findStoreLazy("ApplicationStreamingStore");
const VoiceActions = findByPropsLazy("selectVoiceChannel");
const MediaEngineActions = findByPropsLazy("toggleSelfMute", "toggleSelfDeaf");
const StreamActions = findByCodeLazy("startStreamWithSource");

const settings = definePluginSettings({
    channelId: {
        type: OptionType.STRING,
        description: "Check for channel ids",
        default: ""
    },
    voiceSetting: {
        type: OptionType.RADIO,
        description: "Audio state on join",
        restartNeeded: true,
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
        description: "Stream source",
        default: JSON.stringify({
            id: "screen:0:0",
            name: "Screen 1",
            icon: ""
        }),
        options: async () => {
            const sources = await DiscordNative.desktopCapture.getDesktopCaptureSources({
                types: ["screen"]
            });
            return sources.map((s: any, index: number) => ({
                label: `Screen ${index + 1}`,
                value: JSON.stringify({
                    id: s.id,
                    name: `Screen ${index + 1}`,
                    icon: s.icon
                }),
                default: index === 0
            }));
        }
    }
});

async function startStream() {
    if (ApplicationStreamingStore.getCurrentUserActiveStream() != null) return;

    const sourceData = JSON.parse(settings.store.streamSource!);

    await StreamActions(
        {
            id: sourceData.id,
            name: sourceData.name,
            icon: sourceData.icon
        },
        {
            preset: 0,
            resolution: 1080,
            fps: 60,
            soundshareEnabled: settings.store.streamSound,
            previewDisabled: true,
            analyticsLocations: ["voice control tray"]
        }
    );
}

async function joinCall(channelId: string) {
    const channel = ChannelStore.getChannel(channelId);
    if (!channel) return;

    const voiceStates = VoiceStateStore.getVoiceStatesForChannel(channelId);
    // empty array = call doesnt exist
    if (Object.keys(voiceStates).length === 0) return;

    VoiceActions.selectVoiceChannel(channelId);

    // Waiting here until RTC is connected so discord doesnt freak out
    while (RTCConnectionStore.getConnectionState() !== "RTC_CONNECTED") {
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const { voiceSetting } = settings.store;

    /* TODO: Switch to patching for auto mute setting */
    if (voiceSetting === "deafen") {
        if (!MediaEngineStore.isSelfDeaf()) {
            MediaEngineActions.toggleSelfDeaf();
        }
    } else if (voiceSetting === "mute") {
        if (!MediaEngineStore.isSelfMute()) {
            MediaEngineActions.toggleSelfMute();
        }
    }

    if (settings.store.autoStream) {
        startStream();
    }
}

function getChannelIds(): string[] {
    const { channelId } = settings.store;
    if (!channelId) return [];
    return channelId.split(",").map(id => id.trim()).filter(id => id.length > 0);
}

export default definePlugin({
    name: "AutoJoinCall",
    description: "Automatically joins the specified DM or guild call(s)",
    authors: [Devs.Velocity],
    settings,

    patches: [
        {
            find: "t8({mute:!1",
            replacement: {
                match: /\(a\.mute\|\|a\.deaf\)\s*&&/g,
                replace: "false&&",
            },
            predicate: () => settings.store.voiceSetting === "mute"

        },
        {
            find: "t8({deaf:!1",
            replacement: {
                match: /\(a\.mute\|\|a\.deaf\)\s*&&/g,
                replace: "false&&",
            },
            predicate: () => settings.store.voiceSetting === "deafen"
        }
    ],

    contextMenus: {
        "more-settings-context": streamContextMenuPatch,
        "manage-streams": streamEnablingPatch(settings)
    },

    flux: {
        CALL_CREATE(data: { channelId: string; }) {
            const channelIds = getChannelIds();
            if (channelIds.length === 0) return;

            if (channelIds.includes(data.channelId)) {
                setTimeout(() => joinCall(data.channelId), 100);
            }
        },

        CALL_UPDATE(data: { channelId: string; ringing?: string[]; }) {
            const channelIds = getChannelIds();
            if (channelIds.length === 0) return;

            const isRinging = Array.isArray(data.ringing) && data.ringing.length > 0;

            if (isRinging && channelIds.includes(data.channelId)) {
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

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
import { Logger } from "@utils/Logger";
import { OptionType } from "@utils/types";

export const getDefaultVoice = () => window.speechSynthesis?.getVoices().find(v => v.default);

export function getCurrentVoice(voices = window.speechSynthesis?.getVoices()) {
    if (!voices) return undefined;

    if (settings.store.voice) {
        const voice = voices.find(v => v.voiceURI === settings.store.voice);
        if (voice) return voice;

        new Logger("VcNarrator").error(`Voice "${settings.store.voice}" not found. Resetting to default.`);
    }

    const voice = voices.find(v => v.default);
    if (voice?.voiceURI) {
        settings.store.voice = voice.voiceURI;
    }
    return voice;
}

export const settings = definePluginSettings({
    voice: {
        type: OptionType.SELECT,
        description: "Narrator Voice",
        options: (window.speechSynthesis?.getVoices() ?? [])
            .filter(voice => voice.voiceURI)
            .map(voice => ({
                label: voice.name,
                value: voice.voiceURI!,
                default: voice.default
            })),
        isSearchable: true
    },
    volume: {
        type: OptionType.SLIDER,
        description: "Narrator Volume",
        default: 1,
        markers: [0, 0.25, 0.5, 0.75, 1],
        stickToMarkers: false
    },
    rate: {
        type: OptionType.SLIDER,
        description: "Narrator Speed",
        default: 1,
        markers: [0.1, 0.5, 1, 2, 5, 10],
        stickToMarkers: false
    },
    sayOwnName: {
        description: "Say own name",
        type: OptionType.BOOLEAN,
        default: false
    },
    latinOnly: {
        description: "Strip non latin characters from names before saying them",
        type: OptionType.BOOLEAN,
        default: false
    },
    joinMessage: {
        type: OptionType.STRING,
        description: "Join Message",
        default: "{{USER}} joined"
    },
    leaveMessage: {
        type: OptionType.STRING,
        description: "Leave Message",
        default: "{{USER}} left"
    },
    moveMessage: {
        type: OptionType.STRING,
        description: "Move Message",
        default: "{{USER}} moved to {{CHANNEL}}"
    },
    muteMessage: {
        type: OptionType.STRING,
        description: "Mute Message (only self for now)",
        default: "{{USER}} muted"
    },
    unmuteMessage: {
        type: OptionType.STRING,
        description: "Unmute Message (only self for now)",
        default: "{{USER}} unmuted"
    },
    deafenMessage: {
        type: OptionType.STRING,
        description: "Deafen Message (only self for now)",
        default: "{{USER}} deafened"
    },
    undeafenMessage: {
        type: OptionType.STRING,
        description: "Undeafen Message (only self for now)",
        default: "{{USER}} undeafened"
    }
});

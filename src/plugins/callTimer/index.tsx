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

import { get, set } from "@api/DataStore";
import { showNotification } from "@api/Notifications";
import { Settings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { Devs } from "@utils/constants";
import { useTimer } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import { React, SelectedChannelStore, Toasts, UserStore } from "@webpack/common";

import alignedChatInputFix from "./alignedChatInputFix.css?managed";

function formatDuration(ms: number) {
    const human = Settings.plugins.CallTimer.format === "human";

    const format = (n: number) => human ? n : n.toString().padStart(2, "0");
    const unit = (s: string) => human ? s : "";
    const delim = human ? " " : ":";

    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor(((ms % 86400000) % 3600000) / 60000);
    const s = Math.floor((((ms % 86400000) % 3600000) % 60000) / 1000);

    let res = "";
    if (d) res += `${d}d `;
    if (h || res) res += `${format(h)}${unit("h")}${delim}`;
    if (m || res || !human) res += `${format(m)}${unit("m")}${delim}`;
    res += `${format(s)}${unit("s")}`;

    return res;
}

const timerData = new Map<string, Map<string, number>>();

const getKey = (userId: string) => `CallTimer_${userId}`;

async function loadTimerData(userId: string) {
    const data = await get(getKey(userId));
    if (data) {
        timerData.set(userId, data);
    } else {
        timerData.set(userId, new Map());
    }
}

async function saveTimerData(userId: string) {
    await set(getKey(userId), timerData.get(userId));
}

function getTimerValue(userId: string, channelId: string): number {
    return timerData.get(userId)?.get(channelId) ?? 0;
}

function setTimerValue(userId: string, channelId: string, time: number) {
    if (!timerData.has(userId)) {
        timerData.set(userId, new Map());
    }
    timerData.get(userId)!.set(channelId, time);
}

export default definePlugin({
    name: "CallTimer",
    description: "Adds a timer to vcs",
    authors: [Devs.Ven, Devs.Velocity],
    managedStyle: alignedChatInputFix,

    startTime: 0,
    interval: void 0 as NodeJS.Timeout | undefined,

    options: {
        format: {
            type: OptionType.SELECT,
            description: "The timer format. This can be any valid moment.js format",
            options: [
                {
                    label: "30d 23:00:42",
                    value: "stopwatch",
                    default: true
                },
                {
                    label: "30d 23h 00m 42s",
                    value: "human"
                }
            ]
        },

        saveTimer: {
            type: OptionType.BOOLEAN,
            description: "Save timer progress across sessions",
            default: false,
            onChange(newValue: boolean) {
                const inCall = Object.keys(SelectedChannelStore.getVoiceChannelId?.() || {}).length > 0;

                if (!newValue && inCall) {
                    showNotification({
                        title: "Call Timer",
                        body: "Timer saving disabled. Your timer progress will no longer be saved.",
                        color: "var(--status-danger)",
                        onClick: () => openPluginModal(Velocity.Plugins.plugins.CallTimer)
                    });
                } else if (newValue && inCall) {
                    Toasts.show({
                        message: "Rejoin the call for timer saving to take effect",
                        id: Toasts.genId(),
                        type: Toasts.Type.MESSAGE,
                        options: {
                            duration: 5000,
                            position: Toasts.Position.BOTTOM
                        }
                    });
                }
            }
        }
    },

    patches: [{
        find: "renderConnectionStatus(){",
        replacement: {
            match: /(lineClamp:1,children:)(\i)(?=,|}\))/,
            replace: "$1[$2,$self.renderTimer(this.props.channel.id)]"
        }
    }],

    renderTimer(channelId: string) {
        return <ErrorBoundary noop>
            <this.Timer channelId={channelId} />
        </ErrorBoundary>;
    },

    Timer({ channelId }: { channelId: string; }) {
        const [baseTime, setBaseTime] = React.useState(0);
        const userId = UserStore.getCurrentUser()?.id;
        const totalTimeRef = React.useRef(0);

        React.useEffect(() => {
            if (Settings.plugins.CallTimer.saveTimer && userId) {
                loadTimerData(userId).then(() => {
                    const saved = getTimerValue(userId, channelId);
                    if (saved > 0) {
                        setBaseTime(saved);
                    }
                });
            }
        }, [channelId, userId]);

        const time = useTimer({
            deps: [channelId]
        });

        const totalTime = time + baseTime;
        totalTimeRef.current = totalTime;

        React.useEffect(() => {
            if (!Settings.plugins.CallTimer.saveTimer || !userId) return;

            const saveInterval = setInterval(() => {
                setTimerValue(userId, channelId, totalTimeRef.current);
                saveTimerData(userId);
            }, 5000);

            return () => {
                clearInterval(saveInterval);
                setTimerValue(userId, channelId, totalTimeRef.current);
                saveTimerData(userId);
            };
        }, [userId, channelId]);

        return <p style={{ margin: 0, fontFamily: "var(--font-code)" }}>{formatDuration(totalTime)}</p>;
    }
});

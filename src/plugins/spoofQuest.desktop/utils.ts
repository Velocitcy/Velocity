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

import { findByCodeLazy, findStoreLazy } from "@webpack";
import { ChannelStore, GuildChannelStore } from "@webpack/common";

import type { HeartbeatData, Quest, TaskType } from "./types";

const RunningGameStore = findStoreLazy("RunningGameStore");
const ApplicationStreamingStore = findStoreLazy("ApplicationStreamingStore");
const api = findByCodeLazy('t.Request("GET",e)');

export function isValidQuest(q: Quest): boolean {
    return !!q.userStatus?.enrolledAt && !q.userStatus.completedAt && !!q.config.expiresAt && new Date(q.config.expiresAt).getTime() > Date.now();
}

export function handleVideo(quest: Quest, target: number, progress: number, plugin: any) {
    const enrolled = new Date(quest.userStatus!.enrolledAt!).getTime();
    const questId = quest.id;

    let current = progress;
    let done = false;

    const tick = async () => {
        if (done) return;
        const allowed = Math.floor((Date.now() - enrolled) / 1000) + 10;
        if (allowed >= current + 7) {
            current += 7;
            await api.post(`/quests/${questId}/video-progress`, { timestamp: Math.min(target, current) });
        }
        if (current >= target) {
            await api.post(`/quests/${questId}/video-progress`, { timestamp: target });
            done = true;
        }
    };

    plugin.interval = setInterval(async () => {
        if (done) {
            clearInterval(plugin.interval!);
            plugin.interval = null;
            return;
        }
        await tick();
    }, 1000);
}

export function handleDesktopTask(quest: Quest, target: number, progress: number, plugin: any, isStream: boolean) {
    if (typeof DiscordNative === "undefined") return;

    const appId = quest.config.application.id;
    const appName = quest.config.application.name;

    let restore: () => void;

    if (isStream) {
        const orig = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
        ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({ id: appId, pid: 9999, sourceName: null });
        restore = () => { ApplicationStreamingStore.getStreamerActiveStreamMetadata = orig; };
    } else {
        const pid = Math.floor(Math.random() * 30000) + 2000;
        const fake = {
            cmdLine: "C:/FakeGame/Game.exe",
            exeName: "Game.exe",
            exePath: "C:/FakeGame/Game.exe",
            hidden: false,
            id: appId,
            name: appName,
            pid,
            pidPath: [pid],
            processName: appName,
            start: Date.now()
        };
        const origGames = RunningGameStore.getRunningGames;
        const origPID = RunningGameStore.getGameForPID;
        RunningGameStore.getRunningGames = () => [fake];
        RunningGameStore.getGameForPID = (p: number) => p === pid ? fake : null;
        restore = () => {
            RunningGameStore.getRunningGames = origGames;
            RunningGameStore.getGameForPID = origPID;
        };
    }

    plugin.onBeat = (data: HeartbeatData) => {
        const key = isStream ? "STREAM_ON_DESKTOP" : "PLAY_ON_DESKTOP";
        const val = Math.floor(
            quest.config.configVersion === 1
                ? data.userStatus.streamProgressSeconds ?? 0
                : data.userStatus.progress[key]?.value ?? 0
        );
        if (val >= target) {
            restore();
            plugin.onBeat = null;
        }
    };
}

export function handleActivityTask(quest: Quest, target: number, progress: number, plugin: any) {
    const dm = ChannelStore.getSortedPrivateChannels()?.[0]?.id;
    let channelId = dm ?? null;

    if (!channelId) {
        const guilds = GuildChannelStore.getAllGuilds();
        for (const guild of Object.values(guilds)) {
            const { channels } = (guild as any);
            if (channels) {
                const vc = Object.values(channels).find((c: any) => c.type === 2);
                if (vc) {
                    channelId = (vc as any).id;
                    break;
                }
            }
        }
    }

    if (!channelId) return;

    const streamKey = `call:${channelId}:1`;
    const questId = quest.id;
    let running = true;

    const sendBeat = async (terminal = false) => {
        if (!running) return 0;
        const res = await api.post(`/quests/${questId}/heartbeat`, { stream_key: streamKey, terminal });
        return res.body?.progress?.PLAY_ACTIVITY?.value ?? 0;
    };

    (async () => {
        while (running) {
            const prog = await sendBeat();
            if (prog >= target) {
                await sendBeat(true);
                running = false;
                break;
            }
            await new Promise(r => setTimeout(r, 20000));
        }
    })();

    plugin.unsubscribe = () => { running = false; };
}

export const TASK_HANDLERS: Record<TaskType, (quest: Quest, target: number, progress: number, plugin: any) => void> = {
    WATCH_VIDEO: handleVideo,
    WATCH_VIDEO_ON_MOBILE: handleVideo,
    PLAY_ON_DESKTOP: (quest, target, progress, plugin) => handleDesktopTask(quest, target, progress, plugin, false),
    STREAM_ON_DESKTOP: (quest, target, progress, plugin) => handleDesktopTask(quest, target, progress, plugin, true),
    PLAY_ACTIVITY: handleActivityTask
};

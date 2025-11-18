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
import { ChannelStore, FluxDispatcher, GuildChannelStore } from "@webpack/common";

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
        try {
            const allowed = Math.floor((Date.now() - enrolled) / 1000) + 10;
            const diff = allowed - current;
            const timestamp = current + 7;

            if (diff >= 7) {
                const res = await api.post(`/quests/${questId}/video-progress`, { body: { timestamp: Math.min(target, timestamp + Math.random()) } });
                done = res.body?.completed_at != null;
                current = Math.min(target, timestamp);
            }

            if (timestamp >= target && !done) {
                await api.post(`/quests/${questId}/video-progress`, { body: { timestamp: target } });
                done = true;
            }
        } catch (error) {
            console.error("Video progress error:", error);
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

    const appId = quest.config.application.id;
    const appName = quest.config.application.name;

    if (isStream) {
        const orig = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
        const pid = Math.floor(Math.random() * 30000) + 1000;
        ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
            id: appId,
            pid,
            sourceName: null
        });

        plugin.onBeat = (data: HeartbeatData) => {
            const val = Math.floor(
                quest.config.configVersion === 1
                    ? data.userStatus.streamProgressSeconds ?? 0
                    : data.userStatus.progress.STREAM_ON_DESKTOP?.value ?? 0
            );
            console.log(`Quest progress: ${val}/${target}`);
            if (val >= target) {
                console.log("Quest completed!");
                ApplicationStreamingStore.getStreamerActiveStreamMetadata = orig;
                plugin.onBeat = null;
            }
        };

        console.log(`Spoofed stream to ${appName}. Stream any window in VC for ${Math.ceil((target - progress) / 60)} more minutes.`);
        console.log("Remember: you need at least 1 other person in the VC!");
    } else {
        const pid = Math.floor(Math.random() * 30000) + 1000;
        const exeName = `${appName}.exe`;

        const fake = {
            cmdLine: `C:\\Program Files\\${appName}\\${exeName}`,
            exeName,
            exePath: `c:/program files/${appName.toLowerCase()}/${exeName}`,
            hidden: false,
            isLauncher: false,
            id: appId,
            name: appName,
            pid,
            pidPath: [pid],
            processName: appName,
            start: Date.now()
        };

        const realGames = RunningGameStore.getRunningGames();
        const fakeGames = [fake];
        plugin.origGetRunningGames = RunningGameStore.getRunningGames;
        plugin.origGetGameForPID = RunningGameStore.getGameForPID;
        plugin.fakeGame = fake;

        RunningGameStore.getRunningGames = () => fakeGames;
        RunningGameStore.getGameForPID = (p: number) => fakeGames.find((x: any) => x.pid === p) ?? null;

        FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fake], games: fakeGames });

        plugin.onBeat = (data: HeartbeatData) => {
            const val = Math.floor(
                quest.config.configVersion === 1
                    ? data.userStatus.streamProgressSeconds ?? 0
                    : data.userStatus.progress.PLAY_ON_DESKTOP?.value ?? 0
            );
            console.log(`Quest progress: ${val}/${target}`);
            if (val >= target) {
                console.log("Quest completed!");
                RunningGameStore.getRunningGames = plugin.origGetRunningGames;
                RunningGameStore.getGameForPID = plugin.origGetGameForPID;
                FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fake], added: [], games: [] });
                plugin.onBeat = null;
            }
        };

        console.log(`Spoofed game to ${appName}. Wait for ${Math.ceil((target - progress) / 60)} more minutes.`);
    }
}

export function handleActivityTask(quest: Quest, target: number, progress: number, plugin: any) {
    let channelId = ChannelStore.getSortedPrivateChannels()?.[0]?.id;

    if (!channelId) {
        const guilds = GuildChannelStore.getAllGuilds();
        const guildWithVoice = Object.values(guilds).find((x: any) => x != null && x.VOCAL?.length > 0);
        if (guildWithVoice) {
            channelId = (guildWithVoice as any).VOCAL[0].channel.id;
        }
    }

    if (!channelId) {
        console.log("No voice channel found for activity quest!");
        return;
    }

    const streamKey = `call:${channelId}:1`;
    const questId = quest.id;
    let running = true;

    const sendBeat = async (terminal = false) => {
        if (!running) return 0;
        const res = await api.post(`/quests/${questId}/heartbeat`, { stream_key: streamKey, terminal });
        return res.body?.progress?.PLAY_ACTIVITY?.value ?? 0;
    };

    (async () => {
        console.log("Completing quest", quest.config.messages?.questName);
        while (running) {
            const prog = await sendBeat();
            console.log(`Quest progress: ${prog}/${target}`);
            if (prog >= target) {
                await sendBeat(true);
                console.log("Quest completed!");
                running = false;
                break;
            }
            await new Promise(r => setTimeout(r, 20000));
        }
    })();

    plugin.unsubscribe = () => { running = false; };
}

export const TASK_HANDLERS: Record<TaskType, (quest: Quest, target: number, progress: number, plugin: any) => void | Promise<void>> = {
    WATCH_VIDEO: handleVideo,
    WATCH_VIDEO_ON_MOBILE: handleVideo,
    PLAY_ON_DESKTOP: (quest, target, progress, plugin) => handleDesktopTask(quest, target, progress, plugin, false),
    STREAM_ON_DESKTOP: (quest, target, progress, plugin) => handleDesktopTask(quest, target, progress, plugin, true),
    PLAY_ACTIVITY: handleActivityTask
};

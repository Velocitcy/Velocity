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

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByCodeLazy, findStoreLazy } from "@webpack";
import { FluxDispatcher } from "@webpack/common";

import type { HeartbeatData, Quest, TaskType } from "./types";
import { isValidQuest, TASK_HANDLERS } from "./utils";

const QuestsStore = findStoreLazy("QuestsStore");
const RunningGameStore = findStoreLazy("RunningGameStore");
const api = findByCodeLazy('t.Request("GET",e)');

export default definePlugin({
    name: "SpoofQuest",
    description: "Spoof quest progress",
    authors: [Devs.Velocity],

    onBeat: null as ((data: HeartbeatData) => void) | null,
    interval: null as number | null,
    unsubscribe: null as (() => void) | null,
    fakeGame: null as any,
    origGetRunningGames: null as any,
    origGetGameForPID: null as any,
    currentQuestId: null as string | null,

    patches: [
        {
            find: "poster:null==ns",
            lazy: true,
            replacement: {
                match: /ref:\s*e=>\{([^}]*)e5\.current\s*=\s*e([^}]*)\}/,
                replace: "ref:e=>{ e5.current=e; if(e) e.playbackRate=16; }"
            }
        }
    ],

    start() {
        this.tryRun();
    },

    stop() {
        this.cleanup();
    },

    cleanup() {
        this.onBeat = null;
        this.currentQuestId = null;
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.unsubscribe !== null) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        if (this.fakeGame && this.origGetRunningGames) {
            RunningGameStore.getRunningGames = this.origGetRunningGames;
            RunningGameStore.getGameForPID = this.origGetGameForPID;
            FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [this.fakeGame], added: [], games: [] });
            this.fakeGame = null;
            this.origGetRunningGames = null;
            this.origGetGameForPID = null;
        }
    },

    flux: {
        QUESTS_SEND_HEARTBEAT_SUCCESS: ((function (this: any, e: any) {
            this.onBeat?.(e);
        }) as any),
        QUESTS_ENROLL_SUCCESS: ((function (this: any, e: any) {
            this.cleanup();
            if (e.quest) {
                const cfg = e.quest.config.taskConfig ?? e.quest.config.taskConfigV2;
                const task = Object.keys(cfg.tasks).find(t => cfg.tasks[t]) as TaskType;

                const platformMap: Record<TaskType, number> = {
                    WATCH_VIDEO: 1,
                    WATCH_VIDEO_ON_MOBILE: 2,
                    PLAY_ON_DESKTOP: 0,
                    STREAM_ON_DESKTOP: 0,
                    PLAY_ACTIVITY: 0
                };

                if (task && platformMap[task] !== undefined) {
                    api.post(`/quests/${e.quest.id}/select-platform`, { body: { platform: platformMap[task] } });
                }
            }
            setTimeout(() => this.tryRun(), 100);
        }) as any),
        QUESTS_FETCH_CURRENT_QUESTS_SUCCESS: ((function (this: any) {
            this.tryRun();
        }) as any)
    },

    tryRun() {
        const { quests } = QuestsStore;
        if (!quests?.size) return;

        const quest = [...quests.values()].find(isValidQuest) as Quest | undefined;
        if (!quest || quest.id === this.currentQuestId) return;

        this.currentQuestId = quest.id;

        const cfg = quest.config.taskConfig ?? quest.config.taskConfigV2;
        const task = Object.keys(cfg.tasks).find(t => cfg.tasks[t]) as TaskType;
        if (!task || !TASK_HANDLERS[task]) return;

        const { target } = cfg.tasks[task];
        const progress = quest.userStatus?.progress?.[task]?.value ?? 0;

        if (QuestsStore.isQuestExpired(quest.id)) return;

        TASK_HANDLERS[task](quest, target, progress, this);
    }
});

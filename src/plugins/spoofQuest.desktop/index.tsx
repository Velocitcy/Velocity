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
import { findStoreLazy } from "@webpack";

import type { HeartbeatData, Quest, TaskType } from "./types";
import { isValidQuest, TASK_HANDLERS } from "./utils";

const QuestsStore = findStoreLazy("QuestsStore");

export default definePlugin({
    name: "SpoofQuest",
    description: "Spoof quest progress",
    authors: [Devs.Velocity],

    onBeat: null as ((data: HeartbeatData) => void) | null,
    interval: null as number | null,
    unsubscribe: null as (() => void) | null,

    patches: [
        {
            // Makes WATCH_VIDEO quests be on 16 times speed
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
        this.onBeat = null;
        if (this.interval !== null) clearInterval(this.interval);
        if (this.unsubscribe !== null) this.unsubscribe();
        this.interval = this.unsubscribe = null;
    },

    flux: {
        QUESTS_FETCH_CURRENT_QUESTS_SUCCESS: ((function (this: any, _event: any) {
            this.tryRun();
        }) as any),
        QUESTS_SEND_HEARTBEAT_SUCCESS: ((function (this: any, _event: any, data: HeartbeatData) {
            if (this.onBeat && data?.userStatus) this.onBeat(data);
        }) as any)
    },

    tryRun() {
        const { quests } = QuestsStore;
        if (!quests?.size) return;

        const quest = [...quests.values()].find(isValidQuest) as Quest | undefined;
        if (!quest) return;

        const cfg = quest.config.taskConfig ?? quest.config.taskConfigV2;
        const task = Object.keys(cfg.tasks).find(t => cfg.tasks[t]) as TaskType;
        if (!task || !TASK_HANDLERS[task]) return;

        const { target } = cfg.tasks[task];
        const progress = quest.userStatus?.progress?.[task]?.value ?? 0;

        if (QuestsStore.isQuestExpired(quest.id)) return;

        TASK_HANDLERS[task](quest, target, progress, this);
    }
});

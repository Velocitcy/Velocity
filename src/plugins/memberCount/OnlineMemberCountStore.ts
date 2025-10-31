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

import { proxyLazy } from "@utils/lazy";
import { sleep } from "@utils/misc";
import { Queue } from "@utils/Queue";
import { ChannelActionCreators, Flux, FluxDispatcher, GuildChannelStore } from "@webpack/common";

export const OnlineMemberCountStore = proxyLazy(() => {
    const preloadQueue = new Queue();

    const onlineMemberMap = new Map<string, number>();

    class OnlineMemberCountStore extends Flux.Store {
        getCount(guildId?: string) {
            return onlineMemberMap.get(guildId!);
        }

        async _ensureCount(guildId: string) {
            if (onlineMemberMap.has(guildId)) return;

            await ChannelActionCreators.preload(guildId, GuildChannelStore.getDefaultChannel(guildId).id);
        }

        ensureCount(guildId?: string) {
            if (!guildId || onlineMemberMap.has(guildId)) return;

            preloadQueue.push(() =>
                this._ensureCount(guildId)
                    .then(
                        () => sleep(200),
                        () => sleep(200)
                    )
            );
        }
    }

    return new OnlineMemberCountStore(FluxDispatcher, {
        GUILD_MEMBER_LIST_UPDATE({ guildId, groups }: { guildId: string, groups: { count: number; id: string; }[]; }) {
            onlineMemberMap.set(
                guildId,
                groups.reduce((total, curr) => total + (curr.id === "offline" ? 0 : curr.count), 0)
            );
        },
        ONLINE_GUILD_MEMBER_COUNT_UPDATE({ guildId, count }) {
            onlineMemberMap.set(guildId, count);
        }
    });
});

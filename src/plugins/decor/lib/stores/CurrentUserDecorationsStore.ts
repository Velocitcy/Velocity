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
import { UserStore, zustandCreate } from "@webpack/common";

import { Decoration, deleteDecoration, getUserDecoration, getUserDecorations, NewDecoration, setUserDecoration } from "../api";
import { decorationToAsset } from "../utils/decoration";
import { useUsersDecorationsStore } from "./UsersDecorationsStore";

interface UserDecorationsState {
    decorations: Decoration[];
    selectedDecoration: Decoration | null;
    fetch: () => Promise<void>;
    delete: (decoration: Decoration | string) => Promise<void>;
    create: (decoration: NewDecoration) => Promise<void>;
    select: (decoration: Decoration | null) => Promise<void>;
    clear: () => void;
}

export const useCurrentUserDecorationsStore = proxyLazy(() => zustandCreate((set: any, get: any) => ({
    decorations: [],
    selectedDecoration: null,
    async fetch() {
        const decorations = await getUserDecorations();
        const selectedDecoration = await getUserDecoration();

        set({ decorations, selectedDecoration });
    },
    async create(newDecoration: NewDecoration) {
        const decoration = (await setUserDecoration(newDecoration)) as Decoration;
        set({ decorations: [...get().decorations, decoration] });
    },
    async delete(decoration: Decoration | string) {
        const hash = typeof decoration === "object" ? decoration.hash : decoration;
        await deleteDecoration(hash);

        const { selectedDecoration, decorations } = get();
        const newState = {
            decorations: decorations.filter(d => d.hash !== hash),
            selectedDecoration: selectedDecoration?.hash === hash ? null : selectedDecoration
        };

        set(newState);
    },
    async select(decoration: Decoration | null) {
        if (get().selectedDecoration === decoration) return;
        set({ selectedDecoration: decoration });
        setUserDecoration(decoration);
        useUsersDecorationsStore.getState().set(UserStore.getCurrentUser().id, decoration ? decorationToAsset(decoration) : null);
    },
    clear: () => set({ decorations: [], selectedDecoration: null })
} as UserDecorationsState)));

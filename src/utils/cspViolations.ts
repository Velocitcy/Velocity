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

import { useLayoutEffect } from "@webpack/common";

import { useForceUpdater } from "./react";

const cssRelevantDirectives = ["style-src", "style-src-elem", "img-src", "font-src"] as const;

export const CspBlockedUrls = new Set<string>();
const CspErrorListeners = new Set<() => void>();

document.addEventListener("securitypolicyviolation", ({ effectiveDirective, blockedURI }) => {
    if (!blockedURI || !cssRelevantDirectives.includes(effectiveDirective as any)) return;

    CspBlockedUrls.add(blockedURI);

    CspErrorListeners.forEach(listener => listener());
});

export function useCspErrors() {
    const forceUpdate = useForceUpdater();

    useLayoutEffect(() => {
        CspErrorListeners.add(forceUpdate);

        return () => void CspErrorListeners.delete(forceUpdate);
    }, [forceUpdate]);

    return [...CspBlockedUrls] as const;
}

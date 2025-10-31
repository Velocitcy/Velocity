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

import { Module, ModuleExports, WebpackRequire } from "@vencord/discord-types/webpack";

import { SYM_ORIGINAL_FACTORY, SYM_PATCHED_BY, SYM_PATCHED_SOURCE } from "./patchWebpack";

export type AnyWebpackRequire = ((moduleId: PropertyKey) => ModuleExports) & Partial<Omit<WebpackRequire, "m">> & {
    /** The module factories, where all modules that have been loaded are stored (pre-loaded or loaded by lazy chunks) */
    m: Record<PropertyKey, AnyModuleFactory>;
};

/** exports can be anything, however initially it is always an empty object */
export type AnyModuleFactory = ((this: ModuleExports, module: Module, exports: ModuleExports, require: AnyWebpackRequire) => void) & {
    [SYM_PATCHED_SOURCE]?: string;
    [SYM_PATCHED_BY]?: Set<string>;
};

export type PatchedModuleFactory = AnyModuleFactory & {
    [SYM_ORIGINAL_FACTORY]: AnyModuleFactory;
    [SYM_PATCHED_SOURCE]?: string;
    [SYM_PATCHED_BY]?: Set<string>;
};

export type MaybePatchedModuleFactory = PatchedModuleFactory | AnyModuleFactory;

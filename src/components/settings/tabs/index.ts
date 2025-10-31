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

import "./styles.css";

export * from "./BaseTab";
export { default as DeveloperTab } from "./developer";
export { default as PatchHelperTab } from "./patchHelper";
export { default as PluginsTab } from "./plugins";
export { openContributorModal } from "./plugins/ContributorModal";
export { openPluginModal } from "./plugins/PluginModal";
export { default as BackupAndRestoreTab } from "./sync/BackupAndRestoreTab";
export { default as CloudTab } from "./sync/CloudTab";
export { default as ThemesTab } from "./themes";
export { openUpdaterModal, default as UpdaterTab } from "./updater";
export { default as VelocityTab } from "./velocity";

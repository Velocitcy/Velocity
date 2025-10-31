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

import type { Settings } from "@api/Settings";
import { IpcEvents } from "@shared/IpcEvents";
import { SettingsStore } from "@shared/SettingsStore";
import { mergeDefaults } from "@utils/mergeDefaults";
import { ipcMain } from "electron";
import { mkdirSync, readFileSync, writeFileSync } from "fs";

import { NATIVE_SETTINGS_FILE, SETTINGS_DIR, SETTINGS_FILE } from "./utils/constants";

mkdirSync(SETTINGS_DIR, { recursive: true });

function readSettings<T = object>(name: string, file: string): Partial<T> {
    try {
        return JSON.parse(readFileSync(file, "utf-8"));
    } catch (err: any) {
        if (err?.code !== "ENOENT")
            console.error(`Failed to read ${name} settings`, err);

        return {};
    }
}

export const RendererSettings = new SettingsStore(readSettings<Settings>("renderer", SETTINGS_FILE));

RendererSettings.addGlobalChangeListener(() => {
    try {
        writeFileSync(SETTINGS_FILE, JSON.stringify(RendererSettings.plain, null, 4));
    } catch (e) {
        console.error("Failed to write renderer settings", e);
    }
});

ipcMain.on(IpcEvents.GET_SETTINGS, e => e.returnValue = RendererSettings.plain);

ipcMain.handle(IpcEvents.SET_SETTINGS, (_, data: Settings, pathToNotify?: string) => {
    RendererSettings.setData(data, pathToNotify);
});

export interface NativeSettings {
    plugins: {
        [plugin: string]: {
            [setting: string]: any;
        };
    };
    customCspRules: Record<string, string[]>;
}

const DefaultNativeSettings: NativeSettings = {
    plugins: {},
    customCspRules: {}
};

const nativeSettings = readSettings<NativeSettings>("native", NATIVE_SETTINGS_FILE);
mergeDefaults(nativeSettings, DefaultNativeSettings);

export const NativeSettings = new SettingsStore(nativeSettings as NativeSettings);

NativeSettings.addGlobalChangeListener(() => {
    try {
        writeFileSync(NATIVE_SETTINGS_FILE, JSON.stringify(NativeSettings.plain, null, 4));
    } catch (e) {
        console.error("Failed to write native settings", e);
    }
});

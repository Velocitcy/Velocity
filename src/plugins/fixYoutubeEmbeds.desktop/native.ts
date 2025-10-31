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

import { RendererSettings } from "@main/settings";
import { app } from "electron";

app.on("browser-window-created", (_, win) => {
    win.webContents.on("frame-created", (_, { frame }) => {
        frame?.once("dom-ready", () => {
            if (frame.url.startsWith("https://www.youtube.com/")) {
                const settings = RendererSettings.store.plugins?.FixYoutubeEmbeds;
                if (!settings?.enabled) return;

                frame.executeJavaScript(`
                new MutationObserver(() => {
                    if(
                        document.querySelector('div.ytp-error-content-wrap-subreason a[href*="www.youtube.com/watch?v="]')
                    ) location.reload()
                }).observe(document.body, { childList: true, subtree:true });
                `);
            }
        });
    });
});

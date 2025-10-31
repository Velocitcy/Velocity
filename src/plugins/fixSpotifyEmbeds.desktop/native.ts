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
            if (frame.url.startsWith("https://open.spotify.com/embed/")) {
                const settings = RendererSettings.store.plugins?.FixSpotifyEmbeds;
                if (!settings?.enabled) return;

                frame.executeJavaScript(`
                    const original = Audio.prototype.play;
                    Audio.prototype.play = function() {
                        this.volume = ${(settings.volume / 100) || 0.1};
                        return original.apply(this, arguments);
                    }
                `);
            }
        });
    });
});

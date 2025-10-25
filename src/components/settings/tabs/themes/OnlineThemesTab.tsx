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

import { useSettings } from "@api/Settings";
import { Margins } from "@components/margins";
import { classes } from "@utils/misc";
import { Card, Forms, TextArea, useState } from "@webpack/common";

export function OnlineThemesTab() {
    const settings = useSettings(["themeLinks"]);

    const [themeText, setThemeText] = useState(settings.themeLinks.join("\n"));

    function onBlur() {
        const newLinks = [...new Set(
            themeText
                .trim()
                .split(/\n+/)
                .map(s => s.trim())
                .filter(Boolean)
        )];

        if (JSON.stringify(newLinks) !== JSON.stringify(settings.themeLinks)) {
            settings.themeLinks = newLinks;
        }
    }

    return (
        <>
            <Card className={classes("vc-warning-card", Margins.bottom16)}>
                <Forms.FormText size="md">
                    This section is for advanced users. If you are having difficulties using it, use the
                    Local Themes tab instead.
                </Forms.FormText>
            </Card>
            <Card className="vc-settings-card">
                <Forms.FormTitle tag="h5">Paste links to css files here</Forms.FormTitle>
                <Forms.FormText>One link per line</Forms.FormText>
                <Forms.FormText>You can prefix lines with @light or @dark to toggle them based on your Discord theme</Forms.FormText>
                <Forms.FormText>Make sure to use direct links to files (raw or github.io)!</Forms.FormText>
            </Card>

            <section>
                <Forms.FormTitle tag="h5">Online Themes</Forms.FormTitle>
                <TextArea
                    value={themeText}
                    onChange={setThemeText}
                    className={"vc-settings-theme-links"}
                    placeholder="Enter Theme Links..."
                    spellCheck={false}
                    onBlur={onBlur}
                    rows={10}
                />
            </section>
        </>
    );
}

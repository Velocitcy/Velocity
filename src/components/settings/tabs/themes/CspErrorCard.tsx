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

import { Divider } from "@components/Divider";
import { ErrorCard } from "@components/ErrorCard";
import { Link } from "@components/Link";
import { Margins } from "@components/margins";
import { CspBlockedUrls, useCspErrors } from "@utils/cspViolations";
import { classes } from "@utils/misc";
import { relaunch } from "@utils/native";
import { useForceUpdater } from "@utils/react";
import { Alerts, Button, Forms } from "@webpack/common";

export function CspErrorCard() {
    if (IS_WEB) return null;

    const errors = useCspErrors();
    const forceUpdate = useForceUpdater();

    if (!errors.length) return null;

    const isImgurHtmlDomain = (url: string) => url.startsWith("https://imgur.com/");

    const allowUrl = async (url: string) => {
        const { origin: baseUrl, host } = new URL(url);

        const result = await VelocityNative.csp.requestAddOverride(baseUrl, ["connect-src", "img-src", "style-src", "font-src"], "Velocity Themes");
        if (result !== "ok") return;

        CspBlockedUrls.forEach(url => {
            if (new URL(url).host === host) {
                CspBlockedUrls.delete(url);
            }
        });

        forceUpdate();

        Alerts.show({
            title: "Restart Required",
            body: "A restart is required to apply this change",
            confirmText: "Restart now",
            cancelText: "Later!",
            onConfirm: relaunch
        });
    };

    const hasImgurHtmlDomain = errors.some(isImgurHtmlDomain);

    return (
        <ErrorCard className="vc-settings-card">
            <Forms.FormTitle tag="h5">Blocked Resources</Forms.FormTitle>
            <Forms.FormText>Some images, styles, or fonts were blocked because they come from disallowed domains.</Forms.FormText>
            <Forms.FormText>It is highly recommended to move them to GitHub or Imgur. But you may also allow domains if you fully trust them.</Forms.FormText>
            <Forms.FormText>
                After allowing a domain, you have to fully close (from tray / task manager) and restart {IS_DISCORD_DESKTOP ? "Discord" : "Vesktop"} to apply the change.
            </Forms.FormText>

            <Forms.FormTitle tag="h5" className={classes(Margins.top16, Margins.bottom8)}>Blocked URLs</Forms.FormTitle>
            <div className="vc-settings-csp-list">
                {errors.map((url, i) => (
                    <div key={url}>
                        {i !== 0 && <Divider className={Margins.bottom8} />}
                        <div className="vc-settings-csp-row">
                            <Link href={url}>{url}</Link>
                            <Button color={Button.Colors.PRIMARY} onClick={() => allowUrl(url)} disabled={isImgurHtmlDomain(url)}>
                                Allow
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {hasImgurHtmlDomain && (
                <>
                    <Divider className={classes(Margins.top8, Margins.bottom16)} />
                    <Forms.FormText>
                        Imgur links should be direct links in the form of <code>https://i.imgur.com/...</code>
                    </Forms.FormText>
                    <Forms.FormText>To obtain a direct link, right-click the image and select "Copy image address".</Forms.FormText>
                </>
            )}
        </ErrorCard>
    );
}

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
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { Link } from "@components/Link";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { useAwaiter } from "@utils/react";
import { getRepo, isNewer, UpdateLogger } from "@utils/updater";
import { findComponentByCodeLazy } from "@webpack";
import { React } from "@webpack/common";

import gitHash from "~git-hash";

import { CommonProps, HashLink, Newer, Updatable } from "./Components";

const Spinner = findComponentByCodeLazy("wanderingCubes", "aria-label");

function Updater() {
    const settings = useSettings(["autoUpdate", "autoUpdateNotification"]);
    const [repo, err, repoPending] = useAwaiter(getRepo, {
        fallbackValue: "Loading...",
        onError: e => UpdateLogger.error("Failed to retrieve repo", e)
    });
    const [checkingUpdate, setCheckingUpdate] = React.useState(false);

    const commonProps: CommonProps = { repo, repoPending, checkingUpdate, setCheckingUpdate };

    return (
        <SettingsTab title="Velocity Updater">
            <Heading tag="h5">Updater Settings</Heading>

            <FormSwitch
                title="Automatically update"
                description="Automatically update Velocity without confirmation prompt"
                value={settings.autoUpdate}
                onChange={(v: boolean) => (settings.autoUpdate = v)}
            />
            <FormSwitch
                title="Get notified when an automatic update completes"
                description="Show a notification when Velocity automatically updates"
                value={settings.autoUpdateNotification}
                onChange={(v: boolean) => (settings.autoUpdateNotification = v)}
                disabled={!settings.autoUpdate}
            />

            <Heading tag="h5">Repo</Heading>

            <Paragraph>
                {repoPending ? (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Spinner type="wanderingCubes" />
                        <span>Loading repository...</span>
                    </div>
                ) : err ? (
                    "Failed to retrieve - check console"
                ) : (
                    <>
                        <Link href={repo}>{repo.split("/").slice(-2).join("/")}</Link>{" "}
                        (<HashLink hash={gitHash} repo={repo} disabled={repoPending} />)
                    </>
                )}
            </Paragraph>

            <Divider className={Margins.top8 + " " + Margins.bottom8} />

            <Heading tag="h5">Updates</Heading>

            {isNewer ? <Newer {...commonProps} /> : <Updatable {...commonProps} />}
        </SettingsTab>
    );
}

export default IS_UPDATER_DISABLED ? null : wrapTab(Updater, "Updater");

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

import "./ContributorModal.css";

import { useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import ErrorBoundary from "@components/ErrorBoundary";
import { Link } from "@components/Link";
import { DevsById } from "@utils/constants";
import { fetchUserProfile } from "@utils/discord";
import { classes, pluralise } from "@utils/misc";
import { ModalContent, ModalRoot, openModal } from "@utils/modal";
import { User } from "@vencord/discord-types";
import { Forms, showToast, useEffect, useMemo, UserProfileStore, useStateFromStores } from "@webpack/common";

import Plugins from "~plugins";

import { GithubButton, WebsiteButton } from "./LinkIconButton";
import { PluginCard } from "./PluginCard";

const cl = classNameFactory("vc-author-modal-");

export function openContributorModal(user: User) {
    openModal(modalProps =>
        <ModalRoot {...modalProps}>
            <ErrorBoundary>
                <ModalContent className={cl("root")}>
                    <ContributorModal user={user} />
                </ModalContent>
            </ErrorBoundary>
        </ModalRoot>
    );
}

function ContributorModal({ user }: { user: User; }) {
    useSettings();

    const profile = useStateFromStores([UserProfileStore], () => UserProfileStore.getUserProfile(user.id));

    useEffect(() => {
        if (!profile && !user.bot && user.id)
            fetchUserProfile(user.id);
    }, [user.id, user.bot, profile]);

    const githubName = profile?.connectedAccounts?.find(a => a.type === "github")?.name;
    const website = profile?.connectedAccounts?.find(a => a.type === "domain")?.name;

    const plugins = useMemo(() => {
        const allPlugins = Object.values(Plugins);
        const pluginsByAuthor = DevsById[user.id]
            ? allPlugins.filter(p => p.authors.includes(DevsById[user.id]))
            : allPlugins.filter(p => p.authors.some(a => a.name === user.username));

        return pluginsByAuthor
            .filter(p => !p.name.endsWith("API"))
            .sort((a, b) => Number(a.required ?? false) - Number(b.required ?? false));
    }, [user.id, user.username]);

    const ContributedHyperLink = <Link href="https://Velocity.dev/source">contributed</Link>;

    return (
        <>
            <div className={cl("header")}>
                <img
                    className={cl("avatar")}
                    src={user.getAvatarURL(void 0, 512, true)}
                    alt=""
                />
                <Forms.FormTitle tag="h2" className={cl("name")}>{user.username}</Forms.FormTitle>

                <div className={classes("vc-settings-modal-links", cl("links"))}>
                    {website && (
                        <WebsiteButton
                            text={website}
                            href={`https://${website}`}
                        />
                    )}
                    {githubName && (
                        <GithubButton
                            text={githubName}
                            href={`https://github.com/${githubName}`}
                        />
                    )}
                </div>
            </div>

            {plugins.length ? (
                <Forms.FormText>
                    This person has {ContributedHyperLink} to {pluralise(plugins.length, "plugin")}!
                </Forms.FormText>
            ) : (
                <Forms.FormText>
                    This person has not made any plugins. They likely {ContributedHyperLink} to Velocity in other ways!
                </Forms.FormText>
            )}

            {!!plugins.length && (
                <div className={cl("plugins")}>
                    {plugins.map(p =>
                        <PluginCard
                            key={p.name}
                            plugin={p}
                            disabled={p.required ?? false}
                            onRestartNeeded={() => showToast("Restart to apply changes!")}
                        />
                    )}
                </div>
            )}
        </>
    );
}

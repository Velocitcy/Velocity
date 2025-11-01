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
import { findComponentByCodeLazy } from "@webpack";
import { Forms, React, showToast, UserProfileStore, useStateFromStores } from "@webpack/common";

import Plugins from "~plugins";

import { GithubButton, WebsiteButton } from "./LinkIconButton";
import { PluginCard } from "./PluginCard";

const cl = classNameFactory("vc-author-modal-");
const Spinner = findComponentByCodeLazy("wanderingCubes", "aria-label");

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
    const [fetched, setFetched] = React.useState(false);
    const [fetchFailed, setFetchFailed] = React.useState(false);

    const isAnonymous = user.id === "0";

    React.useEffect(() => {
        if (isAnonymous) {
            setFetched(true);
            return;
        }

        if (!fetched && !user.bot && user.id) {
            const timeout = setTimeout(() => {
                if (!fetched && !profile) {
                    setFetchFailed(true);
                    setFetched(true);
                }
            }, 5000);

            fetchUserProfile(user.id)
                .finally(() => {
                    clearTimeout(timeout);
                    setFetched(true);
                })
                .catch(() => {
                    setFetchFailed(true);
                    setFetched(true);
                });

            return () => clearTimeout(timeout);
        }
    }, [fetched, user.id, user.bot, isAnonymous, profile]);

    const ready = !!profile || fetched || isAnonymous;

    const githubName = profile?.connectedAccounts?.find(a => a.type === "github")?.name;
    const website = profile?.connectedAccounts?.find(a => a.type === "domain")?.name;

    const plugins = React.useMemo(() => {
        const allPlugins = Object.values(Plugins);
        const dev = DevsById[user.id];
        const list = dev
            ? allPlugins.filter(p => p.authors.includes(dev))
            : allPlugins.filter(p => p.authors.some(a => a.name === user.username));
        return list.filter(p => !p.name.endsWith("API"))
            .sort((a, b) => Number(a.required ?? false) - Number(b.required ?? false));
    }, [user.id, user.username]);

    if (!ready) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "300px",
                gap: "1rem"
            }}>
                <Spinner type="wanderingCubes" />
            </div>
        );
    }

    const ContributedHyperLink = <Link href="https://Velocity.dev/source">contributed</Link>;

    return (
        <>
            <div className={cl("header")}>
                <img className={cl("avatar")} src={user.getAvatarURL(void 0, 512, true)} alt="" />
                <Forms.FormTitle tag="h2" className={cl("name")}>
                    {isAnonymous ? "Unavailable" : user.username}
                </Forms.FormTitle>
                {!isAnonymous && (
                    <div className={classes("vc-settings-modal-links", cl("links"))}>
                        {website && <WebsiteButton text={website} href={`https://${website}`} />}
                        {githubName && <GithubButton text={githubName} href={`https://github.com/${githubName}`} />}
                    </div>
                )}
            </div>

            {fetchFailed && !isAnonymous && (
                <Forms.FormText style={{ color: "var(--text-warning)", textAlign: "center", marginBottom: "1rem" }}>
                    Failed to fetch user profile. This might be due to network issues.
                </Forms.FormText>
            )}

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

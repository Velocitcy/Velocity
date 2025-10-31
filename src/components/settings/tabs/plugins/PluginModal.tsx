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

import "./PluginModal.css";

import { generateId } from "@api/Commands";
import { useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { Emoji } from "@components/Emoji";
import ErrorBoundary from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Margins } from "@components/margins";
import { debounce } from "@shared/debounce";
import { gitRemote } from "@shared/velocityUserAgent";
import { openUserProfile } from "@utils/discord";
import { proxyLazy } from "@utils/lazy";
import { classes, isObjectEmpty } from "@utils/misc";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { OptionType, Plugin } from "@utils/types";
import { User } from "@vencord/discord-types";
import { findByPropsLazy } from "@webpack";
import { Clickable, ContextMenuApi, FluxDispatcher, Forms, Menu, React, Text, Tooltip, useEffect, UserStore, UserSummaryItem, UserUtils, useState } from "@webpack/common";
import { Constructor } from "type-fest";

import { PluginMeta } from "~plugins";

import { OptionComponentMap } from "./components";
import { openContributorModal } from "./ContributorModal";
import { GithubButton, WebsiteButton } from "./LinkIconButton";

const cl = classNameFactory("vc-plugin-modal-");
const KbdStyles = findByPropsLazy("key", "combo");

const AvatarStyles = findByPropsLazy("moreUsers", "emptyUser", "avatarContainer", "clickableAvatar");
const UserRecord: Constructor<Partial<User>> = proxyLazy(() => UserStore.getCurrentUser().constructor) as any;

interface PluginModalProps extends ModalProps {
    plugin: Plugin;
    onRestartNeeded(key: string): void;
}

function makeDummyUser(user: { username: string; id?: string; avatar?: string; }) {
    const newUser = new UserRecord({
        username: user.username,
        id: user.id ?? generateId(),
        avatar: user.avatar,
        /** To stop discord making unwanted requests... */
        bot: true,
    });

    FluxDispatcher.dispatch({
        type: "USER_UPDATE",
        user: newUser,
    });

    return newUser;
}

function renderDescription(description: string) {
    const lines = description.split("\n");

    return lines.map((lineText, lineIndex) => {
        const parts: (string | React.JSX.Element)[] = [];
        const comboRegex = /((?:Keybind\("[^"]+"\)\s*\+\s*)+Keybind\("[^"]+"\))/g;
        const emojiRegex = /Emoji\("([^"]+)"\)/g;
        let lastIndex = 0;
        let match;

        while ((match = comboRegex.exec(lineText)) !== null) {
            if (match.index > lastIndex) {
                const textBetween = lineText.substring(lastIndex, match.index);
                let emojiMatch;
                let lastEmojiIndex = 0;

                while ((emojiMatch = emojiRegex.exec(textBetween)) !== null) {
                    if (emojiMatch.index > lastEmojiIndex) {
                        parts.push(textBetween.substring(lastEmojiIndex, emojiMatch.index));
                    }
                    parts.push(<Emoji key={`${lineIndex}-${emojiMatch.index}`} name={emojiMatch[1]} />);
                    lastEmojiIndex = emojiMatch.index + emojiMatch[0].length;
                }

                if (lastEmojiIndex < textBetween.length) {
                    parts.push(textBetween.substring(lastEmojiIndex));
                }
            }

            const keys = match[1].match(/Keybind\("([^"]+)"\)/g).map(k => k.match(/Keybind\("([^"]+)"\)/)[1]);

            parts.push(
                <div key={match.index} className={KbdStyles.combo} style={{ display: "inline-flex" }}>
                    {keys.map((key, i) => (
                        <React.Fragment key={i}>
                            <kbd className={KbdStyles.key} style={{ fontWeight: "bold" }}>{key.toUpperCase()}</kbd>
                            {i < keys.length - 1 && " + "}
                        </React.Fragment>
                    ))}
                </div>
            );

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < lineText.length) {
            const remainingText = lineText.substring(lastIndex);
            let emojiMatch;
            let lastEmojiIndex = 0;

            emojiRegex.lastIndex = 0;

            while ((emojiMatch = emojiRegex.exec(remainingText)) !== null) {
                if (emojiMatch.index > lastEmojiIndex) {
                    parts.push(remainingText.substring(lastEmojiIndex, emojiMatch.index));
                }
                parts.push(<Emoji key={`${lineIndex}-${emojiMatch.index}`} name={emojiMatch[1]} />);
                lastEmojiIndex = emojiMatch.index + emojiMatch[0].length;
            }

            if (lastEmojiIndex < remainingText.length) {
                parts.push(remainingText.substring(lastEmojiIndex));
            }
        }

        return <div key={lineIndex}>{parts.length > 0 ? parts : lineText}</div>;
    });
}

export default function PluginModal({ plugin, onRestartNeeded, onClose, transitionState }: PluginModalProps) {
    const pluginSettings = useSettings().plugins[plugin.name];
    const hasSettings = Boolean(pluginSettings && plugin.options && !isObjectEmpty(plugin.options));

    const [authors, setAuthors] = useState<Partial<User>[]>([]);

    useEffect(() => {
        (async () => {
            for (const user of plugin.authors.slice(0, 6)) {
                try {
                    const author = user.id
                        ? await UserUtils.getUser(String(user.id))
                            .catch(() => makeDummyUser({ username: user.name }))
                        : makeDummyUser({ username: user.name });

                    setAuthors(a => [...a, author]);
                } catch (e) {
                    continue;
                }
            }
        })();
    }, [plugin.authors]);

    function renderSettings() {
        if (!hasSettings || !plugin.options)
            return <Forms.FormText>There are no settings for this plugin.</Forms.FormText>;

        const options = Object.entries(plugin.options).map(([key, setting]) => {
            if (setting.type === OptionType.CUSTOM || setting.hidden) return null;

            function onChange(newValue: any) {
                const option = plugin.options?.[key];
                if (!option || option.type === OptionType.CUSTOM) return;

                pluginSettings[key] = newValue;

                if (option.restartNeeded) onRestartNeeded(key);
            }

            const Component = OptionComponentMap[setting.type];
            return (
                <ErrorBoundary noop key={key}>
                    <Component
                        id={key}
                        option={setting}
                        onChange={debounce(onChange)}
                        pluginSettings={pluginSettings}
                        definedSettings={plugin.settings}
                    />
                </ErrorBoundary>
            );
        });

        return (
            <div className="vc-plugins-settings">
                {options}
            </div>
        );
    }

    function renderMoreUsers(_label: string, count: number) {
        const sliceCount = plugin.authors.length - count;
        const sliceStart = plugin.authors.length - sliceCount;
        const sliceEnd = sliceStart + plugin.authors.length - count;

        return (
            <Tooltip text={plugin.authors.slice(sliceStart, sliceEnd).map(u => u.name).join(", ")}>
                {({ onMouseEnter, onMouseLeave }) => (
                    <div
                        className={AvatarStyles.moreUsers}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    >
                        +{sliceCount}
                    </div>
                )}
            </Tooltip>
        );
    }

    const pluginMeta = PluginMeta[plugin.name];

    return (
        <ModalRoot transitionState={transitionState} size={ModalSize.MEDIUM}>
            <ModalHeader separator={false} className={Margins.bottom8}>
                <Text variant="heading-xl/bold" style={{ flexGrow: 1 }}>{plugin.name}</Text>
                <ModalCloseButton className="icon-only_a22cb0" variant="icon-only" onClick={onClose} />
            </ModalHeader>

            <ModalContent className={Margins.bottom16}>
                <section>
                    <Flex className={cl("info")}>
                        <Forms.FormText className={cl("description")}>
                            {renderDescription(plugin.description)}
                        </Forms.FormText>            {!pluginMeta.userPlugin && (
                            <div className="vc-settings-modal-links">
                                <WebsiteButton
                                    text="View more info"
                                    href={`https://Velocity.dev/plugins/${plugin.name}`}
                                />
                                <GithubButton
                                    text="View source code"
                                    href={`https://github.com/${gitRemote}/tree/main/src/plugins/${pluginMeta.folderName}`}
                                />
                            </div>
                        )}
                    </Flex>
                    <Text variant="heading-lg/semibold" className={classes(Margins.top8, Margins.bottom8)}>Authors</Text>
                    <div style={{ width: "fit-content" }}>
                        <ErrorBoundary noop>
                            <UserSummaryItem
                                users={authors}
                                guildId={undefined}
                                renderIcon={false}
                                max={6}
                                showDefaultAvatarsForNullUsers
                                renderMoreUsers={renderMoreUsers}
                                renderUser={(user: User) => (
                                    <Tooltip text={user.username}>
                                        {({ onMouseEnter, onMouseLeave }) => (
                                            <Clickable
                                                className={AvatarStyles.clickableAvatar}
                                                onClick={() => openContributorModal(user)}
                                                onContextMenu={e => {
                                                    ContextMenuApi.openContextMenu(e, () => (
                                                        <Menu.Menu navId="author-context" onClose={() => ContextMenuApi.closeContextMenu()}>
                                                            <Menu.MenuItem
                                                                id="open-profile"
                                                                label="Open Profile"
                                                                action={() => openUserProfile(user.id)}
                                                            />
                                                        </Menu.Menu>
                                                    ));
                                                }}
                                                onMouseEnter={onMouseEnter}
                                                onMouseLeave={onMouseLeave}
                                            >
                                                <img
                                                    className={AvatarStyles.avatar}
                                                    src={user.getAvatarURL(void 0, 80, true)}
                                                    alt=""
                                                />
                                            </Clickable>
                                        )}
                                    </Tooltip>
                                )}
                            />
                        </ErrorBoundary>
                    </div>
                </section>

                {!!plugin.settingsAboutComponent && (
                    <div className={Margins.top16}>
                        <section>
                            <ErrorBoundary message="An error occurred while rendering this plugin's custom Info Component">
                                <plugin.settingsAboutComponent />
                            </ErrorBoundary>
                        </section>
                    </div>
                )}

                <section>
                    <Text variant="heading-lg/semibold" className={classes(Margins.top16, Margins.bottom8)}>Settings</Text>
                    {renderSettings()}
                </section>
            </ModalContent>
        </ModalRoot>
    );
}

export function openPluginModal(plugin: Plugin, onRestartNeeded?: (pluginName: string, key: string) => void) {
    openModal(modalProps => (
        <PluginModal
            {...modalProps}
            plugin={plugin}
            onRestartNeeded={(key: string) => onRestartNeeded?.(plugin.name, key)}
        />
    ));
}

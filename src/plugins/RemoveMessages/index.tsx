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

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { DeleteIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Button, FormNotice, Forms, Menu, React, TextInput, Toasts, UserStore, useState } from "@webpack/common";

type Rule = Record<"word", string>;

interface RemoveTFProps {
    rulesArray: Rule[];
}

const makeEmptyRule: () => Rule = () => ({
    word: ""
});
const makeEmptyRuleArray = () => [makeEmptyRule()];

function warningComponent() {
    return (
        <>
            <FormNotice
                messageType="danger"
                textColor="text-feedback-danger"
            >
                Note that this plugin will unrender <b>ANY</b> message that contains a specific word.
            </FormNotice>
        </>
    );
}

function Input({ initialValue, onChange, placeholder }: {
    placeholder: string;
    initialValue: string;
    onChange(value: string): void;
}) {
    const [value, setValue] = useState(initialValue);

    return (
        <TextInput
            placeholder={placeholder}
            value={value}
            onChange={setValue}
            spellCheck={false}
            onBlur={() => value !== initialValue && onChange(value)}
        />
    );
}

function RemoveTFSettings({ rulesArray }: RemoveTFProps) {
    async function onClickRemove(index: number) {
        if (index === rulesArray.length - 1) return;
        rulesArray.splice(index, 1);
    }

    async function onChange(e: string, index: number) {
        rulesArray[index].word = e;

        if (index === rulesArray.length - 1 && rulesArray[index].word) {
            rulesArray.push(makeEmptyRule());
        }

        if (!rulesArray[index].word && index !== rulesArray.length - 1) {
            rulesArray.splice(index, 1);
        }
    }

    return (
        <>
            <Forms.FormTitle tag="h4">Words to Remove</Forms.FormTitle>
            <Flex flexDirection="column" style={{ gap: "0.5em" }}>
                {
                    rulesArray.map((rule, index) => {
                        const isLast = index === rulesArray.length - 1;
                        return (
                            <React.Fragment key={`${rule.word}-${index}`}>
                                <Flex flexDirection="row" style={{ flexGrow: 1, gap: "0.5em" }}>
                                    <div style={{ flexGrow: 1 }}>
                                        <Input
                                            placeholder="Word or phrase"
                                            initialValue={rule.word}
                                            onChange={e => onChange(e, index)}
                                        />
                                    </div>
                                    {!isLast && (
                                        <Button
                                            size={Button.Sizes.MIN}
                                            onClick={() => onClickRemove(index)}
                                            style={{
                                                background: "none",
                                                color: "var(--status-danger)"
                                            }}
                                        >
                                            <DeleteIcon width="24" height="24" fill="none" viewBox="0 0 24 24" className="vc-icon" />
                                        </Button>
                                    )}
                                </Flex>
                            </React.Fragment>
                        );
                    })
                }
            </Flex>
        </>
    );
}

const settings = definePluginSettings({
    words: {
        type: OptionType.COMPONENT,
        component: () => {
            const { wordRules } = settings.use(["wordRules"]);

            return (
                <RemoveTFSettings rulesArray={wordRules} />
            );
        }
    },
    wordRules: {
        type: OptionType.CUSTOM,
        default: makeEmptyRuleArray(),
    },
    ignoreBots: {
        type: OptionType.BOOLEAN,
        description: "Ignore messages from bots",
        default: true
    },
    ignoreSelf: {
        type: OptionType.BOOLEAN,
        description: "Ignore your own messages",
        default: true
    }
});

function addWordToRemove(word: string) {
    const rules = settings.store.wordRules;

    const lastIndex = rules.length - 1;
    if (rules[lastIndex] && !rules[lastIndex].word) {
        rules[lastIndex].word = word;
    } else {
        rules.push({ word });
    }

    rules.push(makeEmptyRule());

    Toasts.show({
        message: `Added "${word}" to message filter`,
        id: Toasts.genId(),
        type: Toasts.Type.SUCCESS
    });
}

function removeWordFromFilter(word: string) {
    const rules = settings.store.wordRules;
    const index = rules.findIndex(r => r.word.toLowerCase() === word.toLowerCase());

    if (index !== -1 && index !== rules.length - 1) {
        rules.splice(index, 1);

        Toasts.show({
            message: `Removed "${word}" from message filter`,
            id: Toasts.genId(),
            type: Toasts.Type.SUCCESS
        });
    }
}

function wordExists(word: string): boolean {
    const rules = settings.store.wordRules;
    return rules.some(r => r.word.toLowerCase() === word.toLowerCase());
}

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, _props) => {
    const selection = document.getSelection()?.toString();
    if (!selection) return;

    const group = findGroupChildrenByChildId("search-google", children);
    if (group) {
        const idx = group.findIndex(c => c?.props?.id === "search-google");
        if (idx !== -1) {
            const exists = wordExists(selection);
            const displayText = selection.length > 15 ? selection.slice(0, 15) + "..." : selection;
            group.splice(idx + 1, 0,
                <Menu.MenuItem
                    key="vc-add-message-filter"
                    id="vc-add-message-filter"
                    label={
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>{exists ? "Remove MessageFilter" : "Add MessageFilter"}</span>
                            <span style={{
                                backgroundColor: "var(--background-secondary)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "0.875rem",
                                color: "var(--text-muted)"
                            }}>
                                {displayText}
                            </span>
                        </div>
                    }
                    action={() => exists ? removeWordFromFilter(selection) : addWordToRemove(selection)}
                />
            );
        }
    }
};

export default definePlugin({
    name: "RemoveMessages",
    description: "Removes messages containing specified words",
    authors: [Devs.Velocity],

    settings,

    contextMenus: {
        "message": messageContextMenuPatch
    },

    settingsAboutComponent: warningComponent,

    renderMessageAccessory(props) {
        const currentUser = UserStore.getCurrentUser();

        if (settings.store.ignoreSelf && props.message.author.id === currentUser?.id) return null;
        if (settings.store.ignoreBots && props.message.author.bot) return null;

        const wordsToRemove = settings.store.wordRules
            .filter(r => r.word)
            .map(r => r.word.toUpperCase());

        const messageContent = props.message.content?.toUpperCase() || "";

        if (wordsToRemove.some(word => messageContent.includes(word))) {
            props.message.content = "";
        }

        return null;
    }
});

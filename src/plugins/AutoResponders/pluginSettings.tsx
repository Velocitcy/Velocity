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

import { get, set } from "@api/DataStore";
import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { DeleteIcon } from "@components/Icons";
import { OptionType } from "@utils/types";
import { Alerts, Button, Forms, React, TextInput, useState } from "@webpack/common";

export type Rule = Record<"trigger" | "response" | "onlyIfIncludes", string>;

interface AutoResponderProps {
    title: string;
    rulesArray: Rule[];
}

const makeEmptyRule: () => Rule = () => ({
    trigger: "",
    response: "",
    onlyIfIncludes: ""
});
const makeEmptyRuleArray = () => [makeEmptyRule()];

const HARMFUL_WORDS = [
    "nigger", "nigga", "nig", "negro",
    "faggot", "fag", "tranny", "retard",
    "kike", "chink", "gook", "spic",
    "cunt", "whore", "slut", "bitch",
    "rape", "molest", "pedo", "pedophile",
    "kill yourself", "kys", "suicide", "hang yourself",
    "hitler", "nazi", "holocaust",
    "terrorist", "bomb", "shoot up",
    "lynching", "slave", "slavery",
    "cock", "dick", "pussy", "porn",
    "fuck", "shit", "ass", "damn"
];

const HARMFUL_WARNING_KEY = "AutoResponder_DismissHarmfulWarning";

function containsHarmfulContent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return HARMFUL_WORDS.some(word => lowerText.includes(word));
}

function stringToRegex(str: string) {
    const match = str.match(/^(\/)?(.+?)(?:\/([gimsuyv]*))?$/);
    return match
        ? new RegExp(
            match[2],
            match[3]
                ?.split("")
                .filter((char, pos, flagArr) => flagArr.indexOf(char) === pos)
                .join("")
            ?? "gi"
        )
        : new RegExp(str);
}

function renderTriggerError(trigger: string) {
    try {
        stringToRegex(trigger);
        return null;
    } catch (e) {
        return (
            <span style={{ color: "var(--text-danger)" }}>
                {String(e)}
            </span>
        );
    }
}

async function showHarmfulWarning() {
    const dismissed = await get(HARMFUL_WARNING_KEY);
    if (dismissed) return;

    Alerts.show({
        title: "Harmful Content Warning",
        body: <>
            <Forms.FormText>
                This response contains harmful content that could get your account banned or restricted.
            </Forms.FormText>
        </>,
        confirmText: "Got it",
        secondaryConfirmText: "Don't show again",
        onConfirmSecondary: () => set(HARMFUL_WARNING_KEY, true),
    });
}

function Input({ initialValue, onChange, placeholder }: {
    placeholder: string;
    initialValue: string;
    onChange(value: string): void;
}) {
    const [value, setValue] = useState(initialValue);
    const [hadHarmfulContent, setHadHarmfulContent] = useState(containsHarmfulContent(initialValue));

    const handleBlur = async () => {
        if (value !== initialValue) {
            const hasHarmful = containsHarmfulContent(value);
            if (placeholder === "Response" && hasHarmful && !hadHarmfulContent) {
                await showHarmfulWarning();
            }
            setHadHarmfulContent(hasHarmful);
            onChange(value);
        }
    };

    return (
        <TextInput
            placeholder={placeholder}
            value={value}
            onChange={setValue}
            spellCheck={false}
            onBlur={handleBlur}
        />
    );
}

function AutoResponder({ title, rulesArray }: AutoResponderProps) {
    const isRegexRules = title === "Using Regex";

    async function onClickRemove(index: number) {
        if (index === rulesArray.length - 1) return;
        rulesArray.splice(index, 1);
    }

    async function onChange(e: string, index: number, key: string) {
        rulesArray[index][key] = e;

        if (index === rulesArray.length - 1 && rulesArray[index].trigger && rulesArray[index].response) {
            rulesArray.push(makeEmptyRule());
        }

        if ((!rulesArray[index].trigger || !rulesArray[index].response) && !rulesArray[index].onlyIfIncludes && index !== rulesArray.length - 1) {
            rulesArray.splice(index, 1);
        }
    }

    return (
        <>
            <Forms.FormTitle tag="h4">{title}</Forms.FormTitle>
            <Flex flexDirection="column" style={{ gap: "0.5em" }}>
                {
                    rulesArray.map((rule, index) =>
                        <React.Fragment key={`${rule.trigger}-${index}`}>
                            <Flex flexDirection="row" style={{ flexGrow: 1, gap: "0.5em" }}>
                                <Input
                                    placeholder="Trigger"
                                    initialValue={rule.trigger}
                                    onChange={e => onChange(e, index, "trigger")}
                                />
                                <Input
                                    placeholder="Response"
                                    initialValue={rule.response}
                                    onChange={e => onChange(e, index, "response")}
                                />
                                <Input
                                    placeholder="Only if includes"
                                    initialValue={rule.onlyIfIncludes}
                                    onChange={e => onChange(e, index, "onlyIfIncludes")}
                                />
                                <Button
                                    size={Button.Sizes.MIN}
                                    onClick={() => onClickRemove(index)}
                                    style={{
                                        background: "none",
                                        color: "var(--status-danger)",
                                        ...(index === rulesArray.length - 1
                                            ? {
                                                visibility: "hidden",
                                                pointerEvents: "none"
                                            }
                                            : {}
                                        )
                                    }}
                                >
                                    {DeleteIcon()()}
                                </Button>
                            </Flex>
                            {isRegexRules && renderTriggerError(rule.trigger)}
                        </React.Fragment>
                    )
                }
            </Flex>
        </>
    );
}

function AutoResponderTesting() {
    const [value, setValue] = useState("");

    function testRules(content: string): string {
        if (content.length === 0) return "";

        for (const rule of settings.store.stringRules) {
            if (!rule.trigger || !rule.response) continue;
            if (rule.onlyIfIncludes && !content.includes(rule.onlyIfIncludes)) continue;

            if (content.includes(rule.trigger)) {
                return rule.response.replaceAll("\\n", "\n");
            }
        }

        for (const rule of settings.store.regexRules) {
            if (!rule.trigger || !rule.response) continue;
            if (rule.onlyIfIncludes && !content.includes(rule.onlyIfIncludes)) continue;

            try {
                const regex = stringToRegex(rule.trigger);
                if (regex.test(content)) {
                    return rule.response.replaceAll("\\n", "\n");
                }
            } catch (e) {
                return "";
            }
        }

        return "";
    }

    return (
        <>
            <Forms.FormTitle tag="h4">Test Rules</Forms.FormTitle>
            <TextInput placeholder="Type a message" onChange={setValue} />
            <TextInput placeholder="Response that would be sent" editable={false} value={testRules(value)} />
        </>
    );
}

export const settings = definePluginSettings({
    responder: {
        type: OptionType.COMPONENT,
        component: () => {
            const { stringRules, regexRules } = settings.use(["stringRules", "regexRules"]);

            const hasRules = stringRules.some(r => r.trigger && r.response) || regexRules.some(r => r.trigger && r.response);

            return (
                <>
                    <AutoResponder
                        title="Using String"
                        rulesArray={stringRules}
                    />
                    <AutoResponder
                        title="Using Regex"
                        rulesArray={regexRules}
                    />
                    {hasRules && <AutoResponderTesting />}
                </>
            );
        }
    },
    stringRules: {
        type: OptionType.CUSTOM,
        default: makeEmptyRuleArray(),
    },
    regexRules: {
        type: OptionType.CUSTOM,
        default: makeEmptyRuleArray(),
    },
    ignoreBots: {
        type: OptionType.BOOLEAN,
        description: "Ignore messages from bots",
        default: true
    },
    ignoreServers: {
        type: OptionType.BOOLEAN,
        description: "Ignore messages in servers",
        default: false
    },
    ignoreSelf: {
        type: OptionType.BOOLEAN,
        description: "Ignore your own messages",
        default: true
    },
    cooldown: {
        type: OptionType.SLIDER,
        description: "Global cooldown between auto responses (seconds)",
        default: 0,
        markers: [0, 1, 2, 3, 5, 10, 15, 30, 60],
        stickToMarkers: false
    }
});

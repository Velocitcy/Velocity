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
import { classNameFactory } from "@api/Styles";
import { Flex } from "@components/Flex";
import { CogWheel, DeleteIcon } from "@components/Icons";
import { openModal } from "@utils/modal";
import { OptionType } from "@utils/types";
import { Alerts, Button, Forms, React, TextInput, useState } from "@webpack/common";

import { RuleSettingsModal } from "./components/autoResponderModal";

export const cl = classNameFactory("vc-autoresponder-");

export type Rule = Record<"trigger" | "response" | "onlyIfIncludes", string> & {
    caseSensitive?: boolean;
    matchWholeWord?: boolean;
    ruleCooldown?: number;
    responseCooldown?: number;
};

interface AutoResponderProps {
    title: string;
    rulesArray: Rule[];
}

const makeEmptyRule: () => Rule = () => ({
    trigger: "",
    response: "",
    onlyIfIncludes: "",
    caseSensitive: false,
    matchWholeWord: false
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
    const [, forceUpdate] = useState({});

    function onClickRemove(index: number) {
        if (index === rulesArray.length - 1) return;
        rulesArray.splice(index, 1);
        forceUpdate({});
    }

    function onChange(e: string, index: number, key: string) {
        rulesArray[index][key] = e;

        if (index === rulesArray.length - 1 && rulesArray[index].trigger && rulesArray[index].response) {
            rulesArray.push(makeEmptyRule());
        }

        if ((!rulesArray[index].trigger || !rulesArray[index].response) && index !== rulesArray.length - 1) {
            rulesArray.splice(index, 1);
        }
        forceUpdate({});
    }

    function onClickSettings(rule: Rule, index: number) {
        if (!rule.trigger || !rule.response) return;

        openModal(props => (
            <RuleSettingsModal
                rule={rule}
                onSave={updatedRule => {
                    rulesArray[index] = updatedRule;
                    forceUpdate({});
                }}
                onClose={props.onClose}
                transitionState={props.transitionState}
            />
        ));
    }

    return (
        <>
            <Forms.FormTitle tag="h4">{title}</Forms.FormTitle>
            <Flex flexDirection="column" style={{ gap: "0.5em" }}>
                {
                    rulesArray.map((rule, index) => {
                        const isEmptyRule = index === rulesArray.length - 1;

                        return (
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
                                    {!isEmptyRule && (
                                        <>
                                            <Button
                                                size={Button.Sizes.MIN}
                                                onClick={() => onClickSettings(rule, index)}
                                                style={{ background: "none" }}
                                            >
                                                <CogWheel className={cl("cogwheel-button")} width="24" height="24" viewBox="0 0 24 24" />
                                            </Button>
                                            <Button
                                                size={Button.Sizes.MIN}
                                                onClick={() => onClickRemove(index)}
                                                style={{
                                                    background: "none",
                                                    color: "var(--status-danger)"
                                                }}
                                            >
                                                <DeleteIcon className={cl("delete-button")} width="24" height="24" viewBox="0 0 24 24" />
                                            </Button>
                                        </>
                                    )}
                                </Flex>
                                {isRegexRules && renderTriggerError(rule.trigger)}
                            </React.Fragment>
                        );
                    })
                }
            </Flex>
        </>
    );
}

function AutoResponderTesting() {
    const [value, setValue] = useState("");
    const [lastTestTime, setLastTestTime] = useState(0);
    const [testResult, setTestResult] = useState("");

    function testRules(content: string): void {
        if (!content) {
            setTestResult("");
            return;
        }

        const now = Date.now();
        const globalCooldownMs = settings.store.cooldown * 1000;

        if (now - lastTestTime < globalCooldownMs) {
            setTestResult(`[Global cooldown active - ${Math.ceil((globalCooldownMs - (now - lastTestTime)) / 1000)}s remaining]`);
            return;
        }

        for (const rule of settings.store.stringRules) {
            if (!rule.trigger || !rule.response) continue;
            if (rule.onlyIfIncludes && !content.includes(rule.onlyIfIncludes)) continue;

            let checkContent = content;
            let checkTrigger = rule.trigger;

            if (!rule.caseSensitive) {
                checkContent = checkContent.toLowerCase();
                checkTrigger = checkTrigger.toLowerCase();
            }

            let matches = false;
            if (rule.matchWholeWord) {
                const regex = new RegExp(`\\b${checkTrigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, rule.caseSensitive ? "" : "i");
                matches = regex.test(content);
            } else {
                matches = checkContent.includes(checkTrigger);
            }

            if (matches) {
                const ruleCooldownMs = (rule.ruleCooldown || 0) * 1000;
                const responseCooldownMs = (rule.responseCooldown || 0) * 1000;

                // If still under responseCooldown, skip
                if (now - lastTestTime < responseCooldownMs) {
                    setTestResult(`[Response cooldown active - ${Math.ceil((responseCooldownMs - (now - lastTestTime)) / 1000)}s remaining]`);
                    return;
                }

                if (ruleCooldownMs > 0) {
                    setTestResult(`[Waiting ${rule.ruleCooldown}s before responding...]`);
                    setTimeout(() => {
                        setTestResult(rule.response.replaceAll("\\n", "\n"));
                        setLastTestTime(Date.now());
                    }, ruleCooldownMs);
                } else {
                    setTestResult(rule.response.replaceAll("\\n", "\n"));
                    setLastTestTime(now);
                }
                return;
            }
        }

        for (const rule of settings.store.regexRules) {
            if (!rule.trigger || !rule.response) continue;
            if (rule.onlyIfIncludes && !content.includes(rule.onlyIfIncludes)) continue;

            try {
                const regex = stringToRegex(rule.trigger);
                if (regex.test(content)) {
                    const ruleCooldownMs = (rule.ruleCooldown || 0) * 1000;
                    const responseCooldownMs = (rule.responseCooldown || 0) * 1000;

                    if (now - lastTestTime < responseCooldownMs) {
                        setTestResult(`[Response cooldown active - ${Math.ceil((responseCooldownMs - (now - lastTestTime)) / 1000)}s remaining]`);
                        return;
                    }

                    if (ruleCooldownMs > 0) {
                        setTestResult(`[Waiting ${rule.ruleCooldown}s before responding...]`);
                        setTimeout(() => {
                            setTestResult(rule.response.replaceAll("\\n", "\n"));
                            setLastTestTime(Date.now());
                        }, ruleCooldownMs);
                    } else {
                        setTestResult(rule.response.replaceAll("\\n", "\n"));
                        setLastTestTime(now);
                    }
                    return;
                }
            } catch {
                continue;
            }
        }

        setTestResult("");
    }

    return (
        <>
            <Forms.FormTitle tag="h4">Test Rules</Forms.FormTitle>
            <TextInput
                placeholder="Type a message"
                onChange={v => {
                    setValue(v);
                    testRules(v);
                }}
            />
            <TextInput
                placeholder="Response that would be sent"
                editable={false}
                value={testResult}
            />
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

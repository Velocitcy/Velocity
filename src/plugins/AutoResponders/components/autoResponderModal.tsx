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
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Margins } from "@components/margins";
import { ManaModalDivider, ManaModalFooter, ManaModalHeader, ManaModalRoot } from "@utils/manaModal";
import { ModalContent } from "@utils/modal";
import { Forms, TextInput, useState } from "@webpack/common";

import { Rule } from "../pluginSettings";

export function RuleSettingsModal({ rule, onSave, onClose, transitionState }: { rule: Rule; onSave: (rule: Rule) => void; onClose: () => void; transitionState: any; }) {
    const [caseSensitive, setCaseSensitive] = useState(rule.caseSensitive ?? false);
    const [matchWholeWord, setMatchWholeWord] = useState(rule.matchWholeWord ?? false);
    const [ruleCooldown, setRuleCooldown] = useState<number>(rule.ruleCooldown ?? 0);
    const [responseCooldown, setResponseCooldown] = useState<number>(rule.responseCooldown ?? 0);

    return (
        <ManaModalRoot transitionState={transitionState} onClose={onClose}>
            <ManaModalHeader title="Rule Settings" subtitle="Configure This AutoResponder rule" />
            <ManaModalDivider />
            <ModalContent>
                <Flex flexDirection="column" style={{ gap: "0.5em" }}>
                    <FormSwitch
                        title="Case Sensitive"
                        description="Only match if trigger is a specific casing"
                        value={caseSensitive}
                        onChange={setCaseSensitive}
                    />
                    <FormSwitch
                        title="Match Whole Word"
                        description="Only match if trigger a whole word"
                        value={matchWholeWord}
                        onChange={setMatchWholeWord}
                    />
                    <Forms.FormTitle>Trigger Cooldown</Forms.FormTitle>
                    <Forms.FormText>Wait this many seconds before the rule can trigger again</Forms.FormText>
                    <TextInput
                        type="number"
                        value={ruleCooldown}
                        onChange={v => setRuleCooldown(Math.max(0, Number(v)))}
                        placeholder="0"
                        className={Margins.bottom16}
                    />
                    <Divider />
                    <Forms.FormTitle>Response Cooldown</Forms.FormTitle>
                    <Forms.FormText>Wait this many seconds before another response can happen</Forms.FormText>
                    <TextInput
                        type="number"
                        value={responseCooldown}
                        onChange={v => setResponseCooldown(Math.max(0, Number(v)))}
                        placeholder="0"
                        className={Margins.bottom16}
                    />
                </Flex>
            </ModalContent>
            <ManaModalDivider />
            <ManaModalFooter
                actions={[
                    {
                        text: "Cancel",
                        variant: "secondary",
                        onClick: onClose
                    },
                    {
                        text: "Save Settings",
                        variant: "primary",
                        onClick: () => {
                            onSave({
                                ...rule,
                                caseSensitive,
                                matchWholeWord,
                                ruleCooldown: Math.max(0, ruleCooldown),
                                responseCooldown: Math.max(0, responseCooldown)
                            });
                            onClose();
                        }
                    }
                ]}
            />
        </ManaModalRoot>
    );
}

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

import { Flex } from "@components/Flex";
import { Margins } from "@components/margins";
import { ManaModalDivider, ManaModalFooter, ManaModalHeader, ManaModalRoot } from "@utils/manaModal";
import { ModalContent } from "@utils/modal";
import { Forms, Select, TextInput, useState } from "@webpack/common";

import { SvgElement } from "./types";

const elementTypes = [
    { label: "Path", value: "path" },
    { label: "Circle", value: "circle" },
    { label: "Polygon", value: "polygon" }
];

const ruleOptions = [
    { label: "None", value: "none" },
    { label: "evenodd", value: "evenodd" },
    { label: "nonzero", value: "nonzero" }
];

export function SvgRuleModal({ svg, onSave, onClose, transitionState }: {
    svg: SvgElement;
    onSave: (path: SvgElement) => void;
    onClose: () => void;
    transitionState: any;
}) {
    const [type, setType] = useState<SvgElement["type"]>(svg.type ?? "path");
    const [fill, setFill] = useState(svg.fill ?? "currentColor");
    const [rule, setRule] = useState<string>(svg.fillRule ?? svg.clipRule ?? "none");

    return (
        <ManaModalRoot transitionState={transitionState} onClose={onClose}>
            <ManaModalHeader title="Element Settings" subtitle="Configure SVG element type" />
            <ManaModalDivider />
            <ModalContent>
                <Flex flexDirection="column" style={{ gap: "0.5em", marginBottom: "20px" }}>
                    <Forms.FormTitle>Element Type</Forms.FormTitle>
                    <Select
                        options={elementTypes}
                        isSelected={v => v === type}
                        select={setType}
                        clear={() => setType("path")}
                        clearable={type !== "path"}
                        serialize={v => v}
                    />

                    <Forms.FormTitle className={Margins.top16}>Fill Color</Forms.FormTitle>
                    <TextInput value={fill} onChange={setFill} placeholder="currentColor" />

                    <Forms.FormTitle className={Margins.top16} >Fill/Clip Rule</Forms.FormTitle>
                    <Select
                        options={ruleOptions}
                        isSelected={v => v === rule}
                        select={setRule}
                        clear={() => setRule("none")}
                        clearable={rule !== "none"}
                        serialize={v => v}
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
                        text: "Save",
                        variant: "primary",
                        onClick: () => {
                            const updated: SvgElement = {
                                ...svg,
                                type,
                                fill: fill || "",
                                fillRule: rule !== "none" ? rule as "evenodd" | "nonzero" : undefined,
                                clipRule: rule !== "none" ? rule as "evenodd" | "nonzero" : undefined
                            };

                            onSave(updated);
                            onClose();
                        }
                    }
                ]}
            />
        </ManaModalRoot>
    );
}

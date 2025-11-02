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
import { CogWheel, ErrorIcon } from "@components/Icons";
import {
    Button,
    CalendarPicker,
    Card,
    ColorPicker,
    Forms,
    RadioGroup,
    SearchBar,
    Tooltip,
    useState
} from "@webpack/common";

function Section({ title, search, children }) {
    const visible =
        !search ||
        title.toLowerCase().includes(search.toLowerCase());
    if (!visible) return null;

    return (
        <Card className="vc-card" style={{ flex: 1 }}>
            <Forms.FormTitle tag="h5">{title}</Forms.FormTitle>
            <Flex flexDirection="column" style={{ gap: 10 }}>
                {children}
            </Flex>
        </Card>
    );
}

export function ComponentsTab() {
    const [showPicker, setShowPicker] = useState(false);
    const [color, setColor] = useState<number | null>(0xff9434);
    const [selectedValue, setSelectedValue] = useState("option1");
    const [search, setSearch] = useState("");

    const positions = ["top", "bottom", "left", "right"] as const;
    const buttonColors = ["BRAND", "RED", "GREEN", "PRIMARY", "TRANSPARENT", "LINK"] as const;

    return (
        <>
            <Flex flexDirection="column" style={{ gap: 5 }}>
                <SearchBar
                    autoFocus={true}
                    placeholder="Search sections..."
                    query={search}
                    onClear={() => setSearch("")}
                    onChange={setSearch}
                />
                <Divider style={{ marginBottom: 20 }} />
            </Flex>

            <Flex flexDirection="row" style={{ gap: 20, alignItems: "flex-start" }}>
                <Section title="Calendar Picker" search={search}>
                    <Forms.FormText>Calendar date picker component</Forms.FormText>
                    <Button
                        onClick={() => setShowPicker(!showPicker)}
                        size="medium"
                        color={showPicker ? "red" : "brand"}
                    >
                        {showPicker ? "Close" : "Open"}
                    </Button>

                    {showPicker && (
                        <div style={{ marginTop: 10 }}>
                            <CalendarPicker autoFocus onSelect={() => setShowPicker(false)} />
                        </div>
                    )}
                </Section>

                <Section title="Color picker component" search={search}>
                    <Forms.FormText>Color picker with some cool text effect</Forms.FormText>
                    <Flex flexDirection="row" style={{ alignItems: "center", gap: 10 }}>
                        <ColorPicker
                            color={color}
                            showEyeDropper
                            onChange={value => setColor(value)}
                        />
                        <Forms.FormText
                            style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: color
                                    ? `#${color.toString(16).padStart(6, "0")}`
                                    : "var(--text-normal)"
                            }}
                        >
                            Test Text
                        </Forms.FormText>
                    </Flex>
                </Section>
            </Flex>

            <Divider style={{ margin: "24px 0" }} />

            {("tooltip props section".includes(search.toLowerCase()) || search === "") && (
                <Flex flexDirection="column" style={{ gap: 12 }}>
                    <Forms.FormTitle tag="h5">Tooltip props section</Forms.FormTitle>
                    <Forms.FormText>
                        Custom tooltip position props for Tooltip component.
                    </Forms.FormText>

                    <Flex flexDirection="row" style={{ gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                        {positions.map(position => (
                            <Tooltip
                                key={position}
                                text={`Tooltip on ${position}`}
                                position={position}
                                color="primary"
                            >
                                {({ onMouseEnter, onMouseLeave }) => (
                                    <Button
                                        size="small"
                                        color="brand"
                                        onMouseEnter={onMouseEnter}
                                        onMouseLeave={onMouseLeave}
                                    >
                                        Tooltip on the {position}
                                    </Button>
                                )}
                            </Tooltip>
                        ))}
                    </Flex>
                </Flex>
            )}

            <Divider style={{ margin: "24px 0" }} />

            <Section title="Developer Button Colors" search={search}>
                <Forms.FormText>Test all button color variations.</Forms.FormText>
                <Flex flexDirection="row" style={{ gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    {buttonColors.map(btnColor => (
                        <Button key={btnColor} color={btnColor} size="medium">
                            {btnColor.toUpperCase()}
                        </Button>
                    ))}
                </Flex>
            </Section>

            <Divider style={{ margin: "24px 0" }} />

            <Section title="Radio Groups" search={search}>
                <Forms.FormText>
                    Test radio button props, open console for RADIO props
                </Forms.FormText>

                <RadioGroup.Gu
                    value={selectedValue}
                    options={[
                        { name: "With Color", value: "option1", color: "#ff9434" },
                        { name: "With Description", value: "option2", desc: "This is a description" },
                        { name: "Disabled Option", value: "option3", disabled: true },
                        {
                            name: (
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <span>Option With a Custom HTML!</span>
                                    <div
                                        style={{
                                            marginLeft: "auto",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px"
                                        }}
                                    >
                                        <span>Another text with an icon</span>
                                        <CogWheel
                                            height="24"
                                            width="24"
                                            viewBox="0 0 24 24"
                                            className="vc-icon"
                                        />
                                    </div>
                                </div>
                            ),
                            value: "option4"
                        },
                        { name: "With Color and Desc", value: "option5", color: "#34ff94", desc: "Colored with description" },
                        { name: "With an icon prop", value: "option6", icon: (props: any) => <ErrorIcon {...props} height={24} width={24} viewBox="0 0 24 24" /> },
                        { name: "With Icon Class", desc: "(wrong class lol but you get it.)", value: "option7", radioItemIconClassName: "radioBar__88a69" },
                        { name: "With Bar Class", value: "option8", radioBarClassName: "option_be1a1e" },
                    ]}
                    onChange={option => {
                        console.log("onChange debug:", option);
                        setSelectedValue(option.value);
                    }}
                />
            </Section>
        </>
    );
}

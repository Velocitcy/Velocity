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
import {
    Button,
    CalendarPicker,
    Card,
    ColorPicker,
    Forms,
    Tooltip,
    useState
} from "@webpack/common";

function Section({ title, children }) {
    return (
        <Card className="vc-card" style={{ flex: 1 }}>
            <Forms.FormTitle tag="h5">{title}</Forms.FormTitle>
            <Flex flexDirection="column" style={{ gap: 10 }}>
                {children}
            </Flex>
        </Card>
    );
}

export function PickersTab() {
    const [showPicker, setShowPicker] = useState(false);
    const [color, setColor] = useState<number | null>(0xff9434);

    const positions = ["top", "bottom", "left", "right"] as const;
    const buttonColors = ["BRAND", "RED", "GREEN", "PRIMARY", "TRANSPARENT", "LINK"] as const;

    return (
        <>
            <Flex flexDirection="row" style={{ gap: 20, alignItems: "flex-start" }}>
                <Section title="Developer Date Picker">
                    <Forms.FormText>
                        Open a calendar for testing visuals or time-based features.
                    </Forms.FormText>
                    <Button
                        onClick={() => setShowPicker(!showPicker)}
                        size="medium"
                        color={showPicker ? "red" : "brand"}
                    >
                        {showPicker ? "Close Picker" : "Open Picker"}
                    </Button>

                    {showPicker && (
                        <div style={{ marginTop: 10 }}>
                            <CalendarPicker
                                autoFocus
                                onSelect={() => setShowPicker(false)}
                            />
                        </div>
                    )}
                </Section>

                <Section title="Developer Color Picker">
                    <Forms.FormText>
                        Choose a color for testing theme or highlight behavior.
                    </Forms.FormText>
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

            <Flex flexDirection="column" style={{ gap: 12 }}>
                <Forms.FormTitle tag="h5">Developer Tooltips Section</Forms.FormTitle>
                <Forms.FormText>
                    Hover over the buttons to test all tooltip positions automatically.
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

            <Divider style={{ margin: "24px 0" }} />

            <Flex flexDirection="column" style={{ gap: 12 }}>
                <Forms.FormTitle tag="h5">Developer Button Colors</Forms.FormTitle>
                <Forms.FormText>
                    Test all button color variations.
                </Forms.FormText>

                <Flex flexDirection="row" style={{ gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    {buttonColors.map(btnColor => (
                        <Button key={btnColor} color={btnColor} size="medium">
                            {btnColor.toUpperCase()}
                        </Button>
                    ))}
                </Flex>
            </Flex>
        </>
    );
}

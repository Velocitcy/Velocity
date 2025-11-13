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
import { findByCodeLazy } from "@webpack";
import {
    Button,
    CalendarPicker,
    Card,
    ColorPicker,
    Forms,
    RadioGroup,
    SearchBar,
    TagGroup,
    TextInput,
    Tooltip,
    useState
} from "@webpack/common";

const BotTag = findByCodeLazy(".botTagRegular");

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

export function ComponentsTab() {
    const [showPicker, setShowPicker] = useState(false);
    const [color, setColor] = useState<number | null>(0xff9434);
    const [selectedValue, setSelectedValue] = useState("option1");
    const [search, setSearch] = useState("");
    const [basicInput, setBasicInput] = useState("");
    const [leadingInput, setLeadingInput] = useState("");
    const [countInput, setCountInput] = useState("");
    const [clearableInput, setClearableInput] = useState("Test clearable");
    const [errorInput, setErrorInput] = useState("");
    const [tags, setTags] = useState([
        { id: "bot", label: "Bot" },
        { id: "webhooks", label: "Webhooks" }
    ]);
    const [tagInput, setTagInput] = useState("");

    const positions = ["top", "bottom", "left", "right"] as const;
    const buttonColors = ["BRAND", "RED", "GREEN", "PRIMARY", "TRANSPARENT", "LINK"] as const;

    const addTag = () => {
        if (tagInput.trim()) {
            const newTag = {
                id: Date.now().toString(),
                label: tagInput.trim()
            };
            console.log("Adding tag:", newTag);
            setTags([...tags, newTag]);
            setTagInput("");
        }
    };

    const removeTag = keys => {
        const keyArray = Array.from(keys);
        console.log("Removing tags with keys:", keyArray);
        setTags(tags.filter(tag => !keyArray.includes(tag.id)));
    };

    return (
        <>
            <Flex flexDirection="column" style={{ gap: 5 }}>
                <SearchBar
                    autoFocus={true}
                    placeholder="Search sections..."
                    query={search}
                    onClear={() => {
                        setSearch("");
                    }}
                    onChange={val => {
                        setSearch(val);
                    }}
                />
                <Divider style={{ marginBottom: 20 }} />
            </Flex>

            <Flex flexDirection="row" style={{ gap: 20, alignItems: "flex-start" }}>
                <Section title="Calendar Picker">
                    <Forms.FormText>Calendar date picker component</Forms.FormText>
                    <Button
                        onClick={() => {
                            console.log("Calendar button clicked, showPicker:", !showPicker);
                            setShowPicker(!showPicker);
                        }}
                        size="medium"
                        color={showPicker ? "red" : "brand"}
                    >
                        {showPicker ? "Close" : "Open"}
                    </Button>

                    {showPicker && (
                        <div style={{ marginTop: 10 }}>
                            <CalendarPicker
                                autoFocus
                                onSelect={date => {
                                    console.log("CalendarPicker onSelect:", date);
                                    setShowPicker(false);
                                }}
                            />
                        </div>
                    )}
                </Section>

                <Section title="Color picker component">
                    <Forms.FormText>Color picker with some cool text effect</Forms.FormText>
                    <Flex flexDirection="row" style={{ alignItems: "center", gap: 10 }}>
                        <ColorPicker
                            color={color}
                            showEyeDropper
                            onChange={value => {
                                console.log("ColorPicker onChange:", value);
                                setColor(value);
                            }}
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

            <Section title="Text Input">
                <Forms.FormText>Basic text input with different props</Forms.FormText>

                <TextInput
                    placeholder="Basic input"
                    value={basicInput}
                    onChange={val => {
                        setBasicInput(val);
                    }}
                />

                <TextInput
                    placeholder="With leading text"
                    leading="https://"
                    value={leadingInput}
                    onChange={val => {
                        setLeadingInput(val);
                    }}
                />

                <TextInput
                    placeholder="With character count"
                    value={countInput}
                    onChange={val => {
                        setCountInput(val);
                    }}
                    maxLength={50}
                    showCharacterCount
                />

                <TextInput
                    placeholder="Clearable input"
                    value={clearableInput}
                    onChange={val => {
                        console.log("Clearable TextInput onChange:", val);
                        setClearableInput(val);
                    }}
                    clearable={true}
                />

                <TextInput
                    placeholder="With error"
                    error="This field is required"
                    value={errorInput}
                    onChange={val => {
                        setErrorInput(val);
                    }}
                />
            </Section>

            <Divider style={{ margin: "24px 0" }} />

            <Section title="Tag Input">
                <Forms.FormText>Selectable, removable, and typeable tags</Forms.FormText>

                <Flex flexDirection="row" style={{ gap: 8 }}>
                    <TextInput
                        placeholder="Type tag name..."
                        value={tagInput}
                        onChange={val => {
                            setTagInput(val);
                        }}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addTag();
                            }
                        }}
                    />
                    <Button
                        onClick={() => {
                            addTag();
                        }}
                        size="medium"
                        color="brand"
                    >
                        Add
                    </Button>
                </Flex>

                <TagGroup
                    label="Tags"
                    layout="inline"
                    selectionMode="multiple"
                    items={tags}
                    onRemove={keys => {
                        console.log("TagGroup onRemove:", keys);
                        removeTag(keys);
                    }}
                />
            </Section>

            <Divider style={{ margin: "24px 0" }} />

            <Section title="Bot Tags">
                <Forms.FormText>All of the discord bot tag types</Forms.FormText>
                <Flex flexDirection="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <BotTag type={BotTag.Types.BOT} verified></BotTag>
                    <BotTag type={BotTag.Types.SYSTEM_DM} verified></BotTag>
                    <BotTag type={BotTag.Types.SERVER} verified></BotTag>
                    <BotTag type={BotTag.Types.ORIGINAL_POSTER} verified></BotTag>
                    <BotTag type={BotTag.Types.STAFF_ONLY_DM} verified></BotTag>
                    <BotTag type={BotTag.Types.NOT_STAFF_WARNING} verified></BotTag>
                    <BotTag type={BotTag.Types.REMIX} verified></BotTag>
                </Flex>
            </Section>
            <Divider style={{ margin: "24px 0" }} />


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

            <Divider style={{ margin: "24px 0" }} />

            <Section title="Developer Button Colors">
                <Forms.FormText>Test all button color variations.</Forms.FormText>
                <Flex flexDirection="row" style={{ gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    {buttonColors.map(btnColor => (
                        <Button
                            key={btnColor}
                            color={btnColor}
                            size="medium"
                            onClick={() => console.log(`Button ${btnColor} clicked`)}
                        >
                            {btnColor.toUpperCase()}
                        </Button>
                    ))}
                </Flex>
            </Section>

            <Divider style={{ margin: "24px 0" }} />

            <Section title="Radio Groups">
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
                        console.log("RadioGroup onChange:", option);
                        setSelectedValue(option.value);
                    }}
                />
            </Section>
        </>
    );
}

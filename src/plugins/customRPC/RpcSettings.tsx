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

import "./settings.css";

import { classNameFactory } from "@api/Styles";
import { Divider } from "@components/Divider";
import { Heading } from "@components/Heading";
import { resolveError } from "@components/settings/tabs/plugins/components/Common";
import { debounce } from "@shared/debounce";
import { ActivityType } from "@vencord/discord-types/enums";
import { Select, Text, TextInput, useState } from "@webpack/common";

import { setRpc, settings, TimestampMode } from ".";

const cl = classNameFactory("vc-customRPC-settings-");

type SettingsKey = keyof typeof settings.store;

interface TextOption<T> {
    settingsKey: SettingsKey;
    label: string;
    disabled?: boolean;
    transform?: (value: string) => T;
    isValid?: (value: T) => true | string;
}

interface SelectOption<T> {
    settingsKey: SettingsKey;
    label: string;
    disabled?: boolean;
    options: { label: string; value: T; default?: boolean; }[];
}

const makeValidator = (maxLength: number, isRequired = false) => (value: string) => {
    if (isRequired && !value) return "This field is required.";
    if (value.length > maxLength) return `Must be not longer than ${maxLength} characters.`;
    return true;
};

const maxLength128 = makeValidator(128);

function isAppIdValid(value: string) {
    if (!/^\d{16,21}$/.test(value)) return "Must be a valid Discord ID.";
    return true;
}

const updateRPC = debounce(() => {
    setRpc(true);
    if (Velocity.Plugins.isPluginEnabled("CustomRPC")) setRpc();
});

function isStreamLinkDisabled() {
    return settings.store.type !== ActivityType.STREAMING;
}

function isStreamLinkValid(value: string) {
    if (!isStreamLinkDisabled() && !/https?:\/\/(www\.)?(twitch\.tv|youtube\.com)\/\w+/.test(value)) return "Streaming link must be a valid URL.";
    if (value && value.length > 512) return "Streaming link must be not longer than 512 characters.";
    return true;
}

function parseNumber(value: string) {
    return value ? parseInt(value, 10) : 0;
}

function isNumberValid(value: number) {
    if (isNaN(value)) return "Must be a number.";
    if (value < 0) return "Must be a positive number.";
    return true;
}

function isImageKeyValid(value: string) {
    if (/https?:\/\/(cdn|media)\.discordapp\.(com|net)\//.test(value)) return "Don't use a Discord link. Use an Imgur image link instead.";
    if (/https?:\/\/(?!i\.)?imgur\.com\//.test(value)) return "Imgur link must be a direct link to the image (e.g. https://i.imgur.com/...). Right click the image and click 'Copy image address'";
    if (/https?:\/\/(?!media\.)?tenor\.com\//.test(value)) return "Tenor link must be a direct link to the image (e.g. https://media.tenor.com/...). Right click the GIF and click 'Copy image address'";
    return true;
}

function PairSetting<T>(props: { data: [TextOption<T>, TextOption<T>]; }) {
    const [left, right] = props.data;

    return (
        <div className={cl("pair")}>
            <SingleSetting {...left} />
            <SingleSetting {...right} />
        </div>
    );
}

function SingleSetting<T>({ settingsKey, label, disabled, isValid, transform }: TextOption<T>) {
    const [state, setState] = useState(settings.store[settingsKey] ?? "");
    const [error, setError] = useState<string | null>(null);

    function handleChange(newValue: any) {
        if (transform) newValue = transform(newValue);

        const valid = isValid?.(newValue) ?? true;

        setState(newValue);
        setError(resolveError(valid));

        if (valid === true) {
            settings.store[settingsKey] = newValue;
            updateRPC();
        }
    }

    return (
        <div className={cl("single", { disabled })}>
            <Heading tag="h5">{label}</Heading>
            <TextInput
                type="text"
                placeholder={"Enter a value"}
                value={state}
                onChange={handleChange}
                disabled={disabled}
            />
            {error && <Text className={cl("error")} variant="text-sm/normal">{error}</Text>}
        </div>
    );
}

function SelectSetting<T>({ settingsKey, label, options, disabled }: SelectOption<T>) {
    return (
        <div className={cl("single", { disabled })}>
            <Heading tag="h5">{label}</Heading>
            <Select
                placeholder={"Select an option"}
                options={options}
                maxVisibleItems={5}
                closeOnSelect={true}
                select={v => settings.store[settingsKey] = v}
                isSelected={v => v === settings.store[settingsKey]}
                serialize={v => String(v)}
                isDisabled={disabled}
            />
        </div>
    );
}

export function RPCSettings() {
    const s = settings.use();

    return (
        <div className={cl("root")}>
            <SelectSetting
                settingsKey="type"
                label="Activity Type"
                options={[
                    {
                        label: "Playing",
                        value: ActivityType.PLAYING,
                        default: true
                    },
                    {
                        label: "Streaming",
                        value: ActivityType.STREAMING
                    },
                    {
                        label: "Listening",
                        value: ActivityType.LISTENING
                    },
                    {
                        label: "Watching",
                        value: ActivityType.WATCHING
                    },
                    {
                        label: "Competing",
                        value: ActivityType.COMPETING
                    }
                ]}
            />

            <PairSetting data={[
                { settingsKey: "appID", label: "Application ID", isValid: isAppIdValid },
                { settingsKey: "appName", label: "Application Name", isValid: makeValidator(128, true) },
            ]} />

            <SingleSetting settingsKey="details" label="Detail (line 1)" isValid={maxLength128} />
            <SingleSetting settingsKey="state" label="State (line 2)" isValid={maxLength128} />

            <SingleSetting
                settingsKey="streamLink"
                label="Stream Link (Twitch or YouTube, only if activity type is Streaming)"
                disabled={s.type !== ActivityType.STREAMING}
                isValid={isStreamLinkValid}
            />

            <PairSetting data={[
                {
                    settingsKey: "partySize",
                    label: "Party Size",
                    transform: parseNumber,
                    isValid: isNumberValid
                },
                {
                    settingsKey: "partyMaxSize",
                    label: "Maximum Party Size",
                    transform: parseNumber,
                    isValid: isNumberValid
                },
            ]} />

            <Divider />

            <PairSetting data={[
                { settingsKey: "imageBig", label: "Large Image URL/Key", isValid: isImageKeyValid },
                { settingsKey: "imageBigTooltip", label: "Large Image Text", isValid: maxLength128 },
            ]} />

            <PairSetting data={[
                { settingsKey: "imageSmall", label: "Small Image URL/Key", isValid: isImageKeyValid },
                { settingsKey: "imageSmallTooltip", label: "Small Image Text", isValid: maxLength128 },
            ]} />

            <Divider />

            <PairSetting data={[
                { settingsKey: "buttonOneText", label: "Button1 Text", isValid: makeValidator(31) },
                { settingsKey: "buttonOneURL", label: "Button1 URL" },
            ]} />
            <PairSetting data={[
                { settingsKey: "buttonTwoText", label: "Button2 Text", isValid: makeValidator(31) },
                { settingsKey: "buttonTwoURL", label: "Button2 URL" },
            ]} />

            <Divider />

            <SelectSetting
                settingsKey="timestampMode"
                label="Timestamp Mode"
                options={[
                    {
                        label: "None",
                        value: TimestampMode.NONE,
                        default: true
                    },
                    {
                        label: "Since discord open",
                        value: TimestampMode.NOW
                    },
                    {
                        label: "Same as your current time (not reset after 24h)",
                        value: TimestampMode.TIME
                    },
                    {
                        label: "Custom",
                        value: TimestampMode.CUSTOM
                    }
                ]}
            />

            <PairSetting data={[
                {
                    settingsKey: "startTime",
                    label: "Start Timestamp (in milliseconds)",
                    transform: parseNumber,
                    isValid: isNumberValid,
                    disabled: s.timestampMode !== TimestampMode.CUSTOM,
                },
                {
                    settingsKey: "endTime",
                    label: "End Timestamp (in milliseconds)",
                    transform: parseNumber,
                    isValid: isNumberValid,
                    disabled: s.timestampMode !== TimestampMode.CUSTOM,
                },
            ]} />
        </div>
    );
}

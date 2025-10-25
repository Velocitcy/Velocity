/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Margins } from "@components/margins";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FormNotice, Text } from "@webpack/common";

const settings = definePluginSettings({
    debugKey: {
        type: OptionType.SELECT,
        description: "Key to trigger debugger",
        options: [
            ...Array.from({ length: 12 }, (_, i) => ({
                label: `F${i + 1}`,
                value: `F${i + 1}`,
                default: i === 8
            }))
        ]
    }
});

export default definePlugin({
    name: "F9Debugger",
    description: "Triggers debugger when selected key is pressed",
    authors: [Devs.Velocity],
    settings,

    start() {
        document.addEventListener("keydown", this.handleKeyPress);
    },

    stop() {
        document.removeEventListener("keydown", this.handleKeyPress);
    },

    handleKeyPress(e: KeyboardEvent) {
        if (e.key === settings.store.debugKey && settings.store.debugKey !== "DISABLED") {
            e.preventDefault();
            debugger;
        }
    },

    settingsAboutComponent: () => (
        <>
            <FormNotice
                messageType="danger"
                textColor="text-feedback-danger"
            >
                Pressing the selected key will trigger debugger.
            </FormNotice>
            <Text variant="text-md/normal" className={Margins.top8}>
                This plugin is designed for developers debugging Discord or Velocity issues.
                Only enable this if you understand how to use browser DevTools.
            </Text>
        </>
    )
});

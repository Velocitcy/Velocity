/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { Devs } from "@utils/constants";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";
import { Card, Text } from "@webpack/common";

const settings = definePluginSettings({
    warning: {
        type: OptionType.COMPONENT,
        description: "",
        component: () => (
            <>
                <Card className={classes("vc-settings-card", "vc-backup-restore-card")}>
                    <Flex flexDirection="column">
                        <strong>Warning</strong>
                        <span>Pressing the selected key will freeze Discord. You need DevTools open to trigger the debugger.</span>
                    </Flex>
                </Card>
            </>
        )
    },
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
    },
    bottomText: {
        type: OptionType.COMPONENT,
        description: "",
        component: () => (
            <Text variant="text-md/normal" className={Margins.bottom8}>
                This plugin is designed for developers debugging Discord or Velocity issues.
                Only enable this if you understand how to use browser DevTools.
            </Text>
        )
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
    }
});

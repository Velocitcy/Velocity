/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { LockIcon } from "@components/Icons";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { classes } from "@utils/misc";
import { Card, FeatureCard, FormNotice } from "@webpack/common";

function DevelopersTab() {
    return (
        <SettingsTab title="Developer Visuals" icon={LockIcon()()}>
            <Card className={classes("vc-settings-card", "vc-warning-card")}>
                <Flex flexDirection="column">
                    <strong>Warning</strong>
                    <span>Importing a settings file will overwrite your current settings.</span>
                </Flex>
            </Card>

            <FormNotice messageType="warn" textColor="text-feedback-danger">
                Pressing the selected key will trigger debugger.
            </FormNotice>

            <Flex flexDirection="row">
                <FeatureCard
                    icon={LockIcon()}
                    header="Messages stay private"
                    description="You can see who your teen is talking to, while still respecting their privacy."
                />
                <FeatureCard
                    icon={LockIcon()}
                    header="Easily connect"
                    description="Connect your developer tools quickly with custom integrations."
                />
                <FeatureCard
                    icon={LockIcon()}
                    header="Transparent settings"
                    description="See how your current visuals behave in real-time."
                />
            </Flex>
        </SettingsTab>
    );
}

export default wrapTab(DevelopersTab, "Developer Visuals");

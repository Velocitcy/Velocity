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

import "./styles.css";

import { LockIcon } from "@components/Icons";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { TabBar, useState } from "@webpack/common";

import { ComponentsTab } from "./ComponentsTab";
import { GeneralTab } from "./GeneralTab";

const enum DevTab {
    GENERAL,
    COMPONENTS
}

function DevelopersTab() {
    const [currentTab, setCurrentTab] = useState(DevTab.GENERAL);

    return (
        <SettingsTab title="Developer Visuals" icon={LockIcon({ viewBox: "0 0 24 24", height: 24, width: 24 })}>
            <TabBar
                type="top"
                look="brand"
                className="vc-settings-tab-bar"
                selectedItem={currentTab}
                onItemSelect={setCurrentTab}
            >
                <TabBar.Item id={DevTab.GENERAL} className="vc-settings-tab-bar-item">
                    General
                </TabBar.Item>
                <TabBar.Item id={DevTab.COMPONENTS} className="vc-settings-tab-bar-item">
                    Components
                </TabBar.Item>
            </TabBar>


            {currentTab === DevTab.GENERAL && <GeneralTab />}
            {currentTab === DevTab.COMPONENTS && <ComponentsTab />}

        </SettingsTab>
    );
}

export default IS_DEV ? wrapTab(DevelopersTab, "Developer Visuals") : null;

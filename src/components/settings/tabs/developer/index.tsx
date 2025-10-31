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

import { GeneralTab } from "./GeneralTab";
import { PickersTab } from "./PickersTab";

const enum DevTab {
    GENERAL,
    PICKERS
}

function DevelopersTab() {
    const [currentTab, setCurrentTab] = useState(DevTab.GENERAL);

    return (
        <SettingsTab title="Developer Visuals" icon={LockIcon()()}>
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
                <TabBar.Item id={DevTab.PICKERS} className="vc-settings-tab-bar-item">
                    Pickers
                </TabBar.Item>
            </TabBar>


            {currentTab === DevTab.GENERAL && <GeneralTab />}
            {currentTab === DevTab.PICKERS && <PickersTab />}

        </SettingsTab>
    );
}

export default wrapTab(DevelopersTab, "Developer Visuals");

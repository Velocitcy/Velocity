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

import { HeadingSecondary } from "@components/Heading";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { TabBar, useState } from "@webpack/common";

import PatchHelper from "./PatchHelper";
import SearchHelper from "./SearchHelper";

const enum DevTab {
    PATCH_HELPER,
    SEARCH_HELPER
}

function DevHelpers() {
    const [currentTab, setCurrentTab] = useState(DevTab.PATCH_HELPER);

    return (
        <SettingsTab title="Helpers">
            <HeadingSecondary className="">Helper Tools are designed only for velocity developers</HeadingSecondary>
            <TabBar
                type="top"
                look="brand"
                className="vc-settings-tab-bar"
                selectedItem={currentTab}
                onItemSelect={setCurrentTab}
            >
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={DevTab.PATCH_HELPER}
                >
                    Patch Helper
                </TabBar.Item>
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={DevTab.SEARCH_HELPER}
                >
                    Search Helper
                </TabBar.Item>
            </TabBar>

            {currentTab === DevTab.PATCH_HELPER && IS_DEV && <PatchHelper />}
            {currentTab === DevTab.SEARCH_HELPER && IS_DEV && <SearchHelper />}
        </SettingsTab>
    );
}

export default IS_DEV ? wrapTab(DevHelpers, "DevHelpers") : null;

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

import { definePluginSettings } from "@api/Settings";
import { Link } from "@components/Link";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { closeAllModals } from "@utils/modal";
import { OptionType } from "@utils/types";
import { FluxDispatcher, Forms } from "@webpack/common";

import DecorSection from "./ui/components/DecorSection";

export const settings = definePluginSettings({
    changeDecoration: {
        type: OptionType.COMPONENT,
        component() {
            if (!Velocity.Plugins.plugins.Decor.started) return <Forms.FormText>
                Enable Decor and restart your client to change your avatar decoration.
            </Forms.FormText>;

            return <div>
                <DecorSection hideTitle hideDivider noMargin />
                <Forms.FormText className={classes(Margins.top8, Margins.bottom8)}>
                    You can also access Decor decorations from the <Link
                        href="/settings/profile-customization"
                        onClick={e => {
                            e.preventDefault();
                            closeAllModals();
                            FluxDispatcher.dispatch({ type: "USER_SETTINGS_MODAL_SET_SECTION", section: "Profile Customization" });
                        }}
                    >Profiles</Link> page.
                </Forms.FormText>
            </div>;
        }
    },
    agreedToGuidelines: {
        type: OptionType.BOOLEAN,
        description: "Agreed to guidelines",
        hidden: true,
        default: false
    }
});

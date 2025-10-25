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

import "./LinkIconButton.css";

import { GithubIcon, WebsiteIcon } from "@components/Icons";
import { getTheme, Theme } from "@utils/discord";
import { MaskedLink, Tooltip } from "@webpack/common";

export function GithubLinkIcon() {
    const theme = getTheme() === Theme.Light ? "#000000" : "#FFFFFF";
    return GithubIcon({ fill: theme, className: "vc-settings-modal-link-icon" })();
}

export function WebsiteLinkIcon() {
    const theme = getTheme() === Theme.Light ? "#000000" : "#FFFFFF";
    return WebsiteIcon({ fill: theme, className: "vc-settings-modal-link-icon" })();
}

interface Props {
    text: string;
    href: string;
}

function LinkIcon({ text, href, Icon }: Props & { Icon: React.ComponentType; }) {
    return (
        <Tooltip text={text}>
            {props => (
                <MaskedLink {...props} href={href}>
                    <Icon />
                </MaskedLink>
            )}
        </Tooltip>
    );
}

export const WebsiteButton = (props: Props) => <LinkIcon {...props} Icon={WebsiteLinkIcon} />;
export const GithubButton = (props: Props) => <LinkIcon {...props} Icon={GithubLinkIcon} />;
